@echo off
setlocal
if not "%~1"=="" if /i not "%~1"=="--status-only" (
  echo Usage: run-compact-recovery-s64.cmd [--status-only]
  exit /b 2
)
if not "%~2"=="" exit /b 2
pushd "%~dp0..\.."
if errorlevel 1 exit /b 2
call npm run evaluate:generic-cosmic-overnight -- ^
  --engine=rust-native ^
  --native-preview ^
  --native-binary=evaluation-runs/compact-policy-development/.artifacts/5bc5b974646731b8745de3d32b4171342547fde46a977aaaada0735d2eea80cf/craft-kernel-generic-episode.exe ^
  --native-baseline-solver=generic-craft-external-reference-v2.3.0 ^
  --native-candidate-solver=generic-craft-external-reference-exp-compact-recovery ^
  --risk=balanced ^
  --equipment=E02,E03,E07,E09,E10 ^
  --world=balanced-iid,normal-heavy-iid ^
  --seed-count=64 ^
  --base-seed=20270223 ^
  --workers=4 ^
  --max-workers=4 ^
  --temperature-file=.tmp/overnight-cpu-temperature.json ^
  --thermal-window=5m ^
  --time-budget=4h ^
  --shard-timeout=30m ^
  --retries=1 ^
  --output=evaluation-runs/compact-policy-development ^
  --run-id=compact-recovery-independent-s64 %1
set "taskExitCode=%errorlevel%"
popd
exit /b %taskExitCode%
