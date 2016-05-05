.PHONY: all compile deps clean test migrate docs lint

all: deps compile

compile:
	mix compile

deps:
	mix deps.get
	npm install

clean:
	mix clean --deps

start:
	iex -S mix phoenix.server

test:
	mix test

migrate:
	mix migrate
	MIX_ENV=test mix migrate

rollback:
	mix rollback
	MIX_ENV=test mix rollback

docs:
	mix docs.all

lint:
	MIX_ENV=dev mix lint
	MIX_ENV=test mix lint
