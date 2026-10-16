-- Email links are retired: sign-up proves the mobile with a code (1.10) and a
-- password reset proves the mailbox with a code (1.12).

-- DropForeignKey
ALTER TABLE "email_tokens" DROP CONSTRAINT "email_tokens_user_id_fkey";

-- DropTable
DROP TABLE "email_tokens";

-- DropEnum
DROP TYPE "EmailTokenPurpose";
