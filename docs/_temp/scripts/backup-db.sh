#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Backup Otomatis MariaDB - Nur Mobil
# ==============================================================================
# Dapat dijalankan via cron setiap hari jam 02:00 WIB:
# 0 2 * * * /bin/bash /path/to/showroom-app/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${CONTAINER_NAME:-nur-mobil-db}"
DB_NAME="${DB_NAME:-nur_mobil}"
DB_USER="${DB_USER:-nur_user}"
DB_PASSWORD="${DB_PASSWORD:-nur_password}"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Memulai backup database $DB_NAME dari container $CONTAINER_NAME..."

docker exec "$CONTAINER_NAME" mariadb-dump \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --quick \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup sukses disimpan ke: $BACKUP_FILE"
echo "[$(date)] Ukuran file: $(du -h "$BACKUP_FILE" | cut -f1)"

# Rotasi: Hapus backup yang lebih tua dari RETENTION_DAYS hari
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm {} \;
echo "[$(date)] Pembersihan file backup > $RETENTION_DAYS hari selesai."
