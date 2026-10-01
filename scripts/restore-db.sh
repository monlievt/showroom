#!/usr/bin/env bash
set -e

# ==============================================================================
# NUR MOBIL - DISASTER RECOVERY RESTORE SCRIPT
# ==============================================================================
# Mengembalikan database MariaDB dari file backup .sql.gz
# Penggunaan:
#   bash scripts/restore-db.sh [path_ke_file_backup.sql.gz]
# Jika tanpa argumen, akan otomatis memilih file backup database terbaru di backups/db/
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/db}"
CONTAINER_NAME="${CONTAINER_NAME:-nur-mobil-db}"
DB_NAME="${DB_NAME:-nur_mobil}"
DB_USER="${DB_USER:-nur_user}"
DB_PASSWORD="${DB_PASSWORD:-nur_password}"

TARGET_FILE="$1"

if [ -z "$TARGET_FILE" ]; then
  # Cari file backup .sql.gz terbaru
  TARGET_FILE=$(find "$BACKUP_DIR" -type f -name "*.sql.gz" 2>/dev/null | sort -r | head -n 1)
fi

if [ -z "$TARGET_FILE" ] || [ ! -f "$TARGET_FILE" ]; then
  echo "❌ Error: File backup database tidak ditemukan di '$BACKUP_DIR'!"
  echo "Silakan tentukan file secara eksplisit: bash scripts/restore-db.sh /path/file.sql.gz"
  exit 1
fi

echo "======================================================================"
echo "⚠️  PERINGATAN PEMULIHAN DATABASE (RESTORE)"
echo "File target: $TARGET_FILE"
echo "Database: $DB_NAME"
echo "Tindakan ini akan menimpa seluruh data berjalan dengan data dari snapshot!"
echo "======================================================================"

read -p "Apakah Anda yakin ingin melanjutkan proses restore? (ketik 'YA' untuk konfirmasi): " CONFIRM
if [ "$CONFIRM" != "YA" ]; then
  echo "Proses restore dibatalkan oleh pengguna."
  exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai proses restorasi..."

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  gunzip -c "$TARGET_FILE" | docker exec -i "$CONTAINER_NAME" mariadb -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
elif command -v mysql &> /dev/null; then
  gunzip -c "$TARGET_FILE" | mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
else
  echo "❌ Error: Container '$CONTAINER_NAME' atau command mysql tidak dapat diakses."
  exit 1
fi

echo "======================================================================"
echo "✅ RESTORASI BERHASIL! Database '$DB_NAME' telah dikembalikan."
echo "======================================================================"
