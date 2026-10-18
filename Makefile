# Convenience shortcuts around Wrangler / Drizzle.
#
#   make db-generate     # regenerate SQL migrations from src/db/schema.ts
#   make reset-local     # wipe local D1 + R2 state, then re-apply migrations
#
# `make` needs real tabs in the recipe lines — do not convert them to spaces.

WRANGLER_STATE := .wrangler/state/v3

.PHONY: help db-generate migrate-local migrate-remote seed d1-reset r2-reset reset-local

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

db-generate: ## Generate Drizzle SQL migrations into ./migrations
	npx drizzle-kit generate

migrate-local: ## Apply migrations to the local D1 database
	npm run db:migrate:local

migrate-remote: ## Apply migrations to the remote D1 database
	npm run db:migrate:remote

seed: ## Seed/update a user: make seed EMAIL=a@b.c NAME=Admin PASSWORD=secret123
	npm run seed:user -- --email "$(EMAIL)" --name "$(NAME)" --password "$(PASSWORD)"

d1-reset: ## Wipe the local D1 state (incl. migration history) and re-apply migrations
	rm -rf $(WRANGLER_STATE)/d1
	npm run db:migrate:local

r2-reset: ## Wipe the local R2 state
	rm -rf $(WRANGLER_STATE)/r2

reset-local: d1-reset r2-reset ## Wipe all local storage state (D1 + R2) and re-migrate
