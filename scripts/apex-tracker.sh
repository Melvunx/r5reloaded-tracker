#!/usr/bin/env bash
# Lance R5 Apex Tracker de n'importe où : démarre PostgreSQL (Docker) en arrière-plan, attend qu'il soit prêt,
# puis lance le serveur de dev au premier plan (Ctrl+C pour l'arrêter ; la base reste allumée).
#
# Installation : ln -s "$(pwd)/scripts/apex-tracker.sh" ~/.local/bin/apex-tracker
set -euo pipefail

# Le lien symbolique pointe vers ce fichier : on remonte au dossier du projet, où qu'on soit lancé
SCRIPT="$(readlink -f "${BASH_SOURCE[0]}")"
PROJECT_DIR="${APEX_TRACKER_DIR:-$(dirname "$(dirname "$SCRIPT")")}"
DB_SERVICE="db"
DB_USER="apex"
DB_NAME="apex_tracker"
URL="http://localhost:3000"

info() { printf '\033[1;36m▸\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<USAGE
Usage : apex-tracker [commande]

  (aucune) | start   démarre la base (Docker) puis le serveur de dev ($URL)
  db                 démarre seulement la base
  stop               arrête la base (les données sont conservées)
  status             état de la base
  help               cette aide

Variable : APEX_TRACKER_DIR pour viser un autre dossier de projet.
USAGE
}

compose() { docker compose --project-directory "$PROJECT_DIR" "$@"; }

check_docker() {
  command -v docker >/dev/null || fail "Docker est introuvable. Installe-le ou active l'intégration WSL de Docker Desktop."
  docker info >/dev/null 2>&1 || fail "Le démon Docker ne répond pas. Lance Docker Desktop (ou le service docker), puis réessaie."
}

db_ready() { compose exec -T "$DB_SERVICE" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; }

start_db() {
  check_docker
  info "Démarrage de PostgreSQL (Docker)…"
  compose up -d "$DB_SERVICE" >/dev/null
  for _ in $(seq 1 30); do
    if db_ready; then info "Base prête."; return; fi
    sleep 1
  done
  fail "PostgreSQL n'est pas prêt après 30 s. Regarde les logs : docker compose logs $DB_SERVICE"
}

case "${1:-start}" in
  start)
    [ -f "$PROJECT_DIR/package.json" ] || fail "Projet introuvable : $PROJECT_DIR"
    start_db
    cd "$PROJECT_DIR"
    info "Serveur de dev sur $URL (Ctrl+C pour arrêter ; la base reste allumée, « apex-tracker stop » pour l'éteindre)"
    exec pnpm dev
    ;;
  db)
    start_db
    ;;
  stop)
    check_docker
    compose stop "$DB_SERVICE"
    ;;
  status)
    check_docker
    if db_ready; then info "Base : en marche"; else info "Base : arrêtée"; fi
    ;;
  help | -h | --help)
    usage
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
