service_name=spotify_artist_traverse

THIS_FILE := $(lastword $(MAKEFILE_LIST))

oneHitWonder:
	ts-node oneHitWonder.ts

mongo_shell:
	mongosh $(service_name)

mongo_start:
	mongod --config /opt/homebrew/etc/mongod.conf


list:  # Meta target to list other targets.
	@$(MAKE) -pRrq -f $(THIS_FILE) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | xargs
