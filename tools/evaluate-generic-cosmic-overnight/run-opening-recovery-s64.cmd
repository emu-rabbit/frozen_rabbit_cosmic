@echo off
setlocal
if not "%~1"=="" if /i not "%~1"=="--status-only" (
  echo Usage: run-opening-recovery-s64.cmd [--status-only]
  exit /b 2
)
if not "%~2"=="" exit /b 2
pushd "%~dp0..\.."
if errorlevel 1 exit /b 2
call npm run evaluate:generic-cosmic-overnight -- ^
  --engine=rust-native ^
  --native-preview ^
  --native-binary=evaluation-runs/opening-recovery-development/.artifacts/889253f5f76a47373380e8398a32d783cb1477772e08c139be55a95ee02c8621/craft-kernel-generic-episode.exe ^
  --native-baseline-solver=generic-craft-external-reference-exp-artisan-continuation ^
  --native-candidate-solver=generic-craft-external-reference-exp-opening-recovery ^
  --baseline-dir=evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64 ^
  --risk=balanced ^
  --equipment=E02,E03,E07,E09,E10 ^
  --world=balanced-iid,normal-heavy-iid ^
  --seed-count=64 ^
  --base-seed=20261213 ^
  --workers=4 ^
  --max-workers=4 ^
  --temperature-file=.tmp/overnight-cpu-temperature.json ^
  --thermal-window=5m ^
  --time-budget=4h ^
  --shard-timeout=30m ^
  --retries=1 ^
  --output=evaluation-runs/opening-recovery-development ^
  --run-id=opening-recovery-v23-s64 %1
set "taskExitCode=%errorlevel%"
popd
exit /b %taskExitCode%
