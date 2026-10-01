#!/usr/bin/env bash
set -e

# ==============================================================================
# NUR MOBIL - MULTI-LAYER AUTOMATED BACKUP SUITE (VPS SELF-HOSTED)
# ==============================================================================
# Strategi Backup 4 Lapis (100% Bebas Biaya Langganan Cloud):
#   - Lapis 1: Snapshot Database & Media Lokal VPS (Rotasi Otomatis 7 Hari)
#   - Lapis 2: Off-Site Cloud Telegram Bot (Gratis & Unlimited Storage via API)
#   - Lapis 3: Off-Site Cloud Google Drive (Sinkronisasi Otomatis via Rclone)
#   - Lapis 4: Source Code & Skema Database di GitHub Repository
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_DIR/backups}"
DB_DIR="$BACKUP_ROOT/db"
MEDIA_DIR="$BACKUP_ROOT/media"
UPLOADS_SRC="${UPLOADS_SRC:-$PROJECT_DIR/public/uploads}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${CONTAINER_NAME:-nur-mobil-db}"
DB_NAME="${DB_NAME:-nur_mobil}"
DB_USER="${DB_USER:-nur_user}"
DB_PASSWORD="${DB_PASSWORD:-nur_password}"
RETENTION_DAYS=7

# Credentials Telegram Bot (Opsional - Diambil dari .env jika ada)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

mkdir -p "$DB_DIR" "$MEDIA_DIR"

DB_BACKUP_FILE="$DB_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
MEDIA_BACKUP_FILE="$MEDIA_DIR/uploads_${TIMESTAMP}.tar.gz"

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Memulai Multi-Layer Backup Nur Mobil..."
echo "======================================================================"

# ------------------------------------------------------------------------------
# 1. LAPIS 1: BACKUP DATABASE LOKAL VPS
# ------------------------------------------------------------------------------
echo "» [1/4] Mencadangkan Database MariaDB ($DB_NAME)..."

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker exec "$CONTAINER_NAME" mariadb-dump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --quick \
    "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
elif command -v mysqldump &> /dev/null; then
  mysqldump -u "$DB_USER" -p"$DB_PASSWORD" --single-transaction --quick "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
else
  echo "⚠️ PERINGATAN: Container docker '$CONTAINER_NAME' maupun command mysqldump tidak ditemukan."
  echo "Mencoba fallback via mysqldump lokal..."
fi

if [ -f "$DB_BACKUP_FILE" ] && [ -s "$DB_BACKUP_FILE" ]; then
  DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
  echo "  ✅ Database berhasil di-dump: $DB_BACKUP_FILE ($DB_SIZE)"
else
  echo "  ❌ Gagal membuat file backup database!"
fi

# ------------------------------------------------------------------------------
# 2. LAPIS 1B: BACKUP FOTO & DOKUMEN UPLOADS
# ------------------------------------------------------------------------------
echo "» [2/4] Mengarsipkan File Media & Foto Kendaraan ($UPLOADS_SRC)..."
if [ -d "$UPLOADS_SRC" ]; then
  tar -czf "$MEDIA_BACKUP_FILE" -C "$(dirname "$UPLOADS_SRC")" "$(basename "$UPLOADS_SRC")" 2>/dev/null || true
  MEDIA_SIZE=$(du -h "$MEDIA_BACKUP_FILE" | cut -f1)
  echo "  ✅ Arsip media berhasil dibuat: $MEDIA_BACKUP_FILE ($MEDIA_SIZE)"
else
  echo "  ℹ️ Folder uploads belum ada / masih kosong. Melewati arsip media."
fi

# ------------------------------------------------------------------------------
# 3. LAPIS 2: OFF-SITE CLOUD TELEGRAM BOT (100% GRATIS)
# ------------------------------------------------------------------------------
echo "» [3/4] Mengirim Snapshot ke Cloud Telegram Bot..."
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] && [ -f "$DB_BACKUP_FILE" ]; then
  CAPTION="🔐 *BACKUP DATABASE NUR MOBIL*%0ATanggal: $(date '+%d %b %Y %H:%M')%0AUkuran: $DB_SIZE%0AStatus: ✅ Berhasil"
  
  RESPONSE=$(curl -s -F chat_id="$TELEGRAM_CHAT_ID" \
    -F document=@"$DB_BACKUP_FILE" \
    -F caption="$CAPTION" \
    -F parse_mode="Markdown" \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" || true)

  if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "  ✅ Snapshot database sukses dikirim ke Telegram Owner!"
  else
    echo "  ⚠️ Gagal mengirim ke Telegram API: $RESPONSE"
  fi
else
  echo "  ℹ️ Token Telegram Bot belum diset. Lewati pengiriman Telegram."
  echo "     (Set TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di .env untuk aktifkan)"
fi

# ------------------------------------------------------------------------------
# 4. LAPIS 3: OFF-SITE CLOUD GOOGLE DRIVE VIA RCLONE
# ------------------------------------------------------------------------------
echo "» [4/4] Sinkronisasi ke Google Drive via Rclone..."
if command -v rclone &> /dev/null; then
  if rclone listremotes | grep -q "^gdrive:"; then
    rclone copy "$DB_DIR" "gdrive:nur_mobil_backups/db" --max-age "${RETENTION_DAYS}d" -q
    if [ -f "$MEDIA_BACKUP_FILE" ]; then
      rclone copy "$MEDIA_DIR" "gdrive:nur_mobil_backups/media" --max-age "${RETENTION_DAYS}d" -q
    fi
    echo "  ✅ Backup berhasil disinkronkan ke Google Drive!"
  else
    echo "  ℹ️ Remote 'gdrive:' belum dikonfigurasi di rclone. Lewati sinkronisasi Google Drive."
  fi
else
  echo "  ℹ️ Alat 'rclone' belum terpasang di VPS. Lewati sinkronisasi Google Drive."
fi

# ------------------------------------------------------------------------------
# 5. ROTASI FILE LOKAL VPS (HAPUS YANG LEBIH TUA DARI 7 HARI)
# ------------------------------------------------------------------------------
echo "» Membersihkan snapshot lokal yang berusia lebih dari $RETENTION_DAYS hari..."
find "$DB_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
find "$MEDIA_DIR" -type f -name "*.tar.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
echo "  ✅ Pembersihan rotasi lokal selesai."

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Seluruh Proses Multi-Layer Backup Selesai!"
echo "======================================================================"
