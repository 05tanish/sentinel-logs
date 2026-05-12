# Sentinel-Logs Scripts

Utility scripts for backup, restore, and maintenance.

## Available Scripts

| Script | Description |
|--------|-------------|
| `backup.sh` | Create database backup |
| `restore.sh` | Restore from backup |
| `setup-cron-backup.sh` | Setup automated backups |
| `reset-admin-password.js` | Reset admin password |

---

## backup.sh

Create a complete backup of the SIEM system.

### Usage

```bash
# Set environment variables
export DB_NAME=siem_security
export DB_USER=siem_admin
export DB_PASSWORD=your_password

# Run backup
bash scripts/backup.sh
```

### Options

```bash
# Custom backup directory
export BACKUP_DIR=/path/to/backups

# Custom retention (days)
export BACKUP_RETENTION_DAYS=30
```

### Output

Creates compressed backup: `backups/sentinel-logs-backup-YYYYMMDD_HHMMSS.tar.gz`

---

## restore.sh

Restore SIEM system from backup.

### Usage

```bash
# Set environment variables
export DB_NAME=siem_security
export DB_USER=siem_admin
export DB_PASSWORD=your_password

# List available backups
ls -1 backups/*.tar.gz

# Restore specific backup
bash scripts/restore.sh sentinel-logs-backup-20260512_120000
```

⚠️ **Warning**: This will overwrite current database!

---

## setup-cron-backup.sh

Setup automated daily backups using cron.

### Usage

```bash
bash scripts/setup-cron-backup.sh
```

### Options

Interactive menu:
1. Daily at 2:00 AM
2. Daily at 3:00 AM
3. Every 12 hours
4. Every 6 hours
5. Custom cron expression

### Verify

```bash
# View cron jobs
crontab -l

# View backup logs
tail -f logs/backup-cron.log
```

---

## reset-admin-password.js

Reset admin user password.

### Usage

```bash
# Set new password
export ADMIN_PASSWORD=your_new_secure_password

# Run script
node scripts/reset-admin-password.js
```

### Requirements

- Node.js 18+
- PostgreSQL running
- `DATABASE_URL` or `DB_*` environment variables set

---

## Environment Variables

All scripts require these variables:

```bash
# Database connection
DB_NAME=siem_security
DB_USER=siem_admin
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Or use connection string
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

---

## Troubleshooting

### "Required environment variables not set"

Set the required variables:
```bash
export DB_NAME=siem_security
export DB_USER=siem_admin
export DB_PASSWORD=your_password
```

### "Database connection failed"

Check PostgreSQL is running:
```bash
docker-compose ps postgres
```

### "Permission denied"

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

---

## Best Practices

1. **Test backups regularly** - Verify restore works
2. **Store backups offsite** - Use remote storage
3. **Encrypt backups** - For sensitive data
4. **Monitor backup logs** - Check for failures
5. **Document recovery procedures** - For emergencies

---

## License

MIT License - see [LICENSE](../LICENSE)
