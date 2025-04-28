import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1745849421387 implements MigrationInterface {
  name = 'Migration1745849421387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "submission_logs" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "action" character varying(50) NOT NULL, "status" character varying(20) NOT NULL, "latency" integer, "submission_id" integer NOT NULL, CONSTRAINT "PK_0e54ea9fe9d685e1614d8dc9dbf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_submission_logs_submission_id" ON "submission_logs" ("submission_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_submission_logs_createddt_action" ON "submission_logs" ("created_dt", "action") `,
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(10) NOT NULL, CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_students_name" ON "students" ("name") `);
    await queryRunner.query(
      `CREATE TABLE "submission_media" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "video_url" character varying(255) NOT NULL, "audio_url" character varying(255) NOT NULL, "meta" jsonb NOT NULL, "submission_id" integer NOT NULL, CONSTRAINT "PK_4a2ad30a956a44dba4cf46d1967" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_submission_media_submission_id" ON "submission_media" ("submission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "revisions" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "status" character varying(20) NOT NULL, "component_type" character varying(100) NOT NULL, "submit_text" text NOT NULL, "highlight_submit_text" text, "score" integer, "feedback" text, "highlights" jsonb, "submission_id" integer NOT NULL, CONSTRAINT "PK_4aa9ee2c71c50508c3c501573c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_revisions_submission" ON "revisions" ("submission_id") `);
    await queryRunner.query(`CREATE INDEX "idx_revisions_created" ON "revisions" ("created_dt") `);
    await queryRunner.query(
      `CREATE TABLE "submissions" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "component_type" character varying(100) NOT NULL, "submit_text" text NOT NULL, "highlight_submit_text" text, "score" integer, "feedback" text, "highlights" jsonb, "status" character varying(20) NOT NULL, "student_id" integer NOT NULL, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_submissions_student_id" ON "submissions" ("student_id") `);
    await queryRunner.query(`CREATE INDEX "idx_submissions_created" ON "submissions" ("created_dt") `);
    await queryRunner.query(`CREATE INDEX "idx_submissions_status_created" ON "submissions" ("status", "created_dt") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_submissions_student_component" ON "submissions" ("student_id", "component_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_submissions_student_status_created" ON "submissions" ("student_id", "status", "created_dt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "stats_monthly" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "period_start" date NOT NULL, "total_submissions" integer NOT NULL, "total_revisions" integer NOT NULL, "success_count" integer NOT NULL, "failed_count" integer NOT NULL, "revision_success_count" integer NOT NULL, "revision_failed_count" integer NOT NULL, CONSTRAINT "PK_811f58177efd700f48e07e7fa16" PRIMARY KEY ("id", "period_start")); COMMENT ON COLUMN "stats_monthly"."total_submissions" IS '총 과제 요청 수'; COMMENT ON COLUMN "stats_monthly"."total_revisions" IS '총 재평가 요청 수'; COMMENT ON COLUMN "stats_monthly"."success_count" IS '성공으로 완료된 재평가 수'; COMMENT ON COLUMN "stats_monthly"."failed_count" IS '실패로 끝난 재평가 수'; COMMENT ON COLUMN "stats_monthly"."revision_success_count" IS '성공으로 완료된 재평가 수'; COMMENT ON COLUMN "stats_monthly"."revision_failed_count" IS '성공으로 완료된 재평가 수'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5acccfa50c8173617091f7ff07" ON "stats_monthly" ("period_start") `,
    );
    await queryRunner.query(
      `CREATE TABLE "stats_daily" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "period_start" date NOT NULL, "total_submissions" integer NOT NULL, "total_revisions" integer NOT NULL, "success_count" integer NOT NULL, "failed_count" integer NOT NULL, "revision_success_count" integer NOT NULL, "revision_failed_count" integer NOT NULL, CONSTRAINT "PK_486b1021e48161585923e7b91d4" PRIMARY KEY ("id", "period_start")); COMMENT ON COLUMN "stats_daily"."total_submissions" IS '총 과제 요청 수'; COMMENT ON COLUMN "stats_daily"."total_revisions" IS '총 재평가 요청 수'; COMMENT ON COLUMN "stats_daily"."success_count" IS '성공으로 완료된 평가 수'; COMMENT ON COLUMN "stats_daily"."failed_count" IS '실패로 끝난 평가 수'; COMMENT ON COLUMN "stats_daily"."revision_success_count" IS '성공으로 완료된 재평가 수'; COMMENT ON COLUMN "stats_daily"."revision_failed_count" IS '성공으로 완료된 재평가 수'`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8a3ecb2c44e491f666f45e771b" ON "stats_daily" ("period_start") `);
    await queryRunner.query(
      `CREATE TABLE "stats_weekly" ("id" SERIAL NOT NULL, "created_dt" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT now(), "period_start" date NOT NULL, "total_submissions" integer NOT NULL, "total_revisions" integer NOT NULL, "success_count" integer NOT NULL, "failed_count" integer NOT NULL, "revision_success_count" integer NOT NULL, "revision_failed_count" integer NOT NULL, CONSTRAINT "PK_563023e6f99df580f644da3f45f" PRIMARY KEY ("id", "period_start")); COMMENT ON COLUMN "stats_weekly"."total_submissions" IS '총 과제 요청 수'; COMMENT ON COLUMN "stats_weekly"."total_revisions" IS '총 재평가 요청 수'; COMMENT ON COLUMN "stats_weekly"."success_count" IS '성공으로 완료된 재평가 수'; COMMENT ON COLUMN "stats_weekly"."failed_count" IS '실패로 끝난 재평가 수'; COMMENT ON COLUMN "stats_weekly"."revision_success_count" IS '성공으로 완료된 재평가 수'; COMMENT ON COLUMN "stats_weekly"."revision_failed_count" IS '성공으로 완료된 재평가 수'`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1feea74c738749c49fe402210f" ON "stats_weekly" ("period_start") `);
    await queryRunner.query(
      `ALTER TABLE "submission_logs" ADD CONSTRAINT "FK_90a0447df332ee34a42ab096b4a" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submission_media" ADD CONSTRAINT "FK_2e9be2f1f37d7a484e38f4ce78e" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "revisions" ADD CONSTRAINT "FK_5aac4b8e3d5c3e7ba52a95254ad" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "submissions" ADD CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae"`);
    await queryRunner.query(`ALTER TABLE "revisions" DROP CONSTRAINT "FK_5aac4b8e3d5c3e7ba52a95254ad"`);
    await queryRunner.query(`ALTER TABLE "submission_media" DROP CONSTRAINT "FK_2e9be2f1f37d7a484e38f4ce78e"`);
    await queryRunner.query(`ALTER TABLE "submission_logs" DROP CONSTRAINT "FK_90a0447df332ee34a42ab096b4a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1feea74c738749c49fe402210f"`);
    await queryRunner.query(`DROP TABLE "stats_weekly"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8a3ecb2c44e491f666f45e771b"`);
    await queryRunner.query(`DROP TABLE "stats_daily"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5acccfa50c8173617091f7ff07"`);
    await queryRunner.query(`DROP TABLE "stats_monthly"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submissions_student_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."uq_submissions_student_component"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submissions_status_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submissions_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submissions_student_id"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_revisions_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_revisions_submission"`);
    await queryRunner.query(`DROP TABLE "revisions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submission_media_submission_id"`);
    await queryRunner.query(`DROP TABLE "submission_media"`);
    await queryRunner.query(`DROP INDEX "public"."idx_students_name"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submission_logs_createddt_action"`);
    await queryRunner.query(`DROP INDEX "public"."idx_submission_logs_submission_id"`);
    await queryRunner.query(`DROP TABLE "submission_logs"`);
  }
}
