# Variables
NPM := npm
RUN := $(NPM) run

# Detect OS
ifeq ($(OS),Windows_NT)
	RM := rmdir /s /q
else
	RM := rm -rf
endif

.DEFAULT_GOAL := build

.PHONY: build preview test clean

dev:
	@echo "Developing the project..."
	@$(RUN) dev -- --host

build:
	@echo "Building the project..."
	@$(RUN) build

preview:
	@echo "Previewing the project..."
	@$(RUN) preview -- --host

test: build preview
	@echo "Build and preview completed successfully."

clean:
	@echo "Cleaning up..."
	@$(RM) node_modules dist