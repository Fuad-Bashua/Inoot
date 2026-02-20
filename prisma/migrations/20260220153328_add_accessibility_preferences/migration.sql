-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "fontSizePreference" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "highContrast" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taskDetailLevel" TEXT NOT NULL DEFAULT 'detailed';
