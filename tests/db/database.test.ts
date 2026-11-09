import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { TEST_DATABASE_URL, asRole, createTestDatabase, dropTestDatabase } from "./helpers";

const DB = "clinica_vitest";
const run = TEST_DATABASE_URL ? describe : describe.skip;

run("Base de datos (Postgres real)", () => {
  let pool: Pool;
  let ivanId: string;
  let carolinaId: string;
  let treatmentId: string;

  beforeAll(async () => {
    pool = await createTestDatabase(DB);
    const pros = await pool.query("select id, slug from professionals");
    ivanId = pros.rows.find((r) => r.slug === "ivan-melgar")!.id;
    carolinaId = pros.rows.find((r) => r.slug === "carolina-santistevan")!.id;
    treatmentId = (await pool.query("select id from treatments where slug = 'hidrafacial'")).rows[0].id;
  }, 60_000);

  afterAll(async () => {
    if (pool) await dropTestDatabase(pool, DB);
  });

  let counter = 0;
  function bookingValues(professionalId: string, startsAt: string, minutes = 60, buffer = 15) {
    counter++;
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + minutes * 60_000);
    const blocked = new Date(end.getTime() + buffer * 60_000);
    return [
      `T${counter}${randomUUID().slice(0, 6)}`,
      treatmentId,
      professionalId,
      start.toISOString(),
      end.toISOString(),
      blocked.toISOString(),
      "Hidrafacial",
      minutes,
      350,
      "Cliente Prueba",
      "+59170000000",
      "cliente@example.com",
      randomUUID(),
    ];
  }

  const insertSql = `insert into bookings (code, treatment_id, professional_id, starts_at, ends_at,
      blocked_until, treatment_name, duration_minutes, price, customer_name, customer_phone,
      customer_email, token_hash) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`;

  describe("seed", () => {
    it("carga el catálogo, los profesionales y los horarios", async () => {
      const t = await pool.query("select count(*)::int as n from treatments");
      expect(t.rows[0].n).toBe(15);
      const carolina = await pool.query(
        `select count(*)::int as n from treatment_professionals where professional_id = $1`,
        [carolinaId],
      );
      expect(carolina.rows[0].n).toBe(8);
      const ivan = await pool.query(
        `select count(*)::int as n from treatment_professionals where professional_id = $1`,
        [ivanId],
      );
      expect(ivan.rows[0].n).toBe(15);
    });

    it("Carolina NO tiene asignado ningún inyectable", async () => {
      const r = await pool.query(
        `select t.slug from treatments t join treatment_professionals tp on tp.treatment_id = t.id
         where tp.professional_id = $1 and t.slug in ('toxina-botulinica-3-zonas','acido-hialuronico-labios','bioestimulador-de-colageno','prp-facial','mesoterapia-facial-skinbooster','mesoterapia-corporal-lipoenzimas')`,
        [carolinaId],
      );
      expect(r.rows).toHaveLength(0);
    });
  });

  describe("prevención de dobles reservas", () => {
    it("rechaza dos citas superpuestas con el mismo profesional", async () => {
      await pool.query(insertSql, bookingValues(ivanId, "2030-01-07T14:00:00Z"));
      await expect(
        pool.query(insertSql, bookingValues(ivanId, "2030-01-07T14:30:00Z")),
      ).rejects.toMatchObject({ code: "23P01" });
    });

    it("permite la misma hora con OTRO profesional (2 citas simultáneas)", async () => {
      await pool.query(insertSql, bookingValues(ivanId, "2030-01-08T14:00:00Z"));
      await expect(
        pool.query(insertSql, bookingValues(carolinaId, "2030-01-08T14:00:00Z")),
      ).resolves.toBeTruthy();
    });

    it("respeta el intervalo de 15 minutos entre citas", async () => {
      // Cita 14:00–15:00, bloqueada hasta 15:15
      await pool.query(insertSql, bookingValues(ivanId, "2030-01-09T14:00:00Z"));
      await expect(
        pool.query(insertSql, bookingValues(ivanId, "2030-01-09T15:00:00Z")),
      ).rejects.toMatchObject({ code: "23P01" });
      await expect(
        pool.query(insertSql, bookingValues(ivanId, "2030-01-09T15:15:00Z")),
      ).resolves.toBeTruthy();
    });

    it("una cita cancelada libera el horario", async () => {
      const r = await pool.query(insertSql, bookingValues(ivanId, "2030-01-10T14:00:00Z"));
      await pool.query(`update bookings set status = 'cancelled' where id = $1`, [r.rows[0].id]);
      await expect(
        pool.query(insertSql, bookingValues(ivanId, "2030-01-10T14:00:00Z")),
      ).resolves.toBeTruthy();
    });

    it("con 10 pedidos SIMULTÁNEOS al mismo horario, solo uno gana", async () => {
      const attempts = await Promise.allSettled(
        Array.from({ length: 10 }, () =>
          pool.query(insertSql, bookingValues(carolinaId, "2030-01-11T15:00:00Z")),
        ),
      );
      const ok = attempts.filter((a) => a.status === "fulfilled");
      const failed = attempts.filter((a) => a.status === "rejected") as PromiseRejectedResult[];
      expect(ok).toHaveLength(1);
      expect(failed).toHaveLength(9);
      for (const f of failed) expect(f.reason.code).toBe("23P01");
    });

    it("no permite reactivar una cita cancelada si el horario ya se ocupó", async () => {
      const a = await pool.query(insertSql, bookingValues(ivanId, "2030-01-12T14:00:00Z"));
      await pool.query(`update bookings set status = 'cancelled' where id = $1`, [a.rows[0].id]);
      await pool.query(insertSql, bookingValues(ivanId, "2030-01-12T14:00:00Z"));
      await expect(
        pool.query(`update bookings set status = 'confirmed' where id = $1`, [a.rows[0].id]),
      ).rejects.toMatchObject({ code: "23P01" });
    });
  });

  describe("horarios semanales", () => {
    it("no permite bloques superpuestos el mismo día", async () => {
      await expect(
        pool.query(
          `insert into availability_rules (professional_id, weekday, start_time, end_time) values ($1, 1, '18:00', '20:00')`,
          [ivanId],
        ),
      ).rejects.toMatchObject({ code: "23P01" });
    });
  });

  describe("Row Level Security", () => {
    it("el público NO puede leer reservas", async () => {
      const rows = await asRole(pool, "anon", async (q) => (await q("select * from bookings")).rows);
      expect(rows).toHaveLength(0);
    });

    it("el público NO puede crear reservas directamente", async () => {
      await expect(
        asRole(pool, "anon", (q) => q(insertSql, bookingValues(ivanId, "2030-02-01T14:00:00Z"))),
      ).rejects.toMatchObject({ code: "42501" });
    });

    it("el público solo ve tratamientos visibles", async () => {
      await pool.query(`update treatments set is_visible = false where slug = 'hidrafacial'`);
      const rows = await asRole(pool, "anon", async (q) => (await q("select slug from treatments")).rows);
      expect(rows.map((r) => r.slug)).not.toContain("hidrafacial");
      expect(rows).toHaveLength(14);
      await pool.query(`update treatments set is_visible = true where slug = 'hidrafacial'`);
    });

    it("el público no puede modificar el catálogo", async () => {
      const updated = await asRole(pool, "anon", async (q) =>
        (await q(`update treatments set price = 1 returning id`)).rows,
      );
      expect(updated).toHaveLength(0);
    });

    it("el público no ve bloqueos, correos ni rate limits", async () => {
      for (const table of ["availability_blocks", "email_logs", "rate_limits", "admin_users"]) {
        const rows = await asRole(pool, "anon", async (q) => (await q(`select * from ${table}`)).rows);
        expect(rows, table).toHaveLength(0);
      }
    });

    it("un usuario autenticado que NO es admin no puede leer reservas", async () => {
      const rows = await asRole(
        pool,
        "authenticated",
        async (q) => (await q("select * from bookings")).rows,
        randomUUID(),
      );
      expect(rows).toHaveLength(0);
    });

    it("el manager (admin_users) puede leer y modificar todo", async () => {
      const adminId = randomUUID();
      await pool.query(`insert into admin_users (user_id, email) values ($1, 'admin@example.com')`, [
        adminId,
      ]);
      const result = await asRole(
        pool,
        "authenticated",
        async (q) => {
          const bookings = (await q("select id from bookings")).rows;
          const updated = (await q(`update treatments set price = price returning id`)).rows;
          return { bookings, updated };
        },
        adminId,
      );
      expect(result.bookings.length).toBeGreaterThan(0);
      expect(result.updated).toHaveLength(15);
    });
  });

  describe("rate limit", () => {
    it("permite hasta el límite y luego bloquea", async () => {
      const results: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        const r = await pool.query(`select hit_rate_limit('ip:test', 3, 3600) as ok`);
        results.push(r.rows[0].ok);
      }
      expect(results).toEqual([true, true, true, false, false]);
    });

    it("el público no puede ejecutar la función", async () => {
      await expect(
        asRole(pool, "anon", (q) => q(`select hit_rate_limit('x', 1, 60)`)),
      ).rejects.toMatchObject({ code: "42501" });
    });
  });
});
