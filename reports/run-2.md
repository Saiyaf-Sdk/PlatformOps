# CI run 2

- ref: `main` · commit: `53fb252c19d2a5ba4106d9167b968a17cff4e640`
- backend: **failure** · frontend: **success** · docker: **skipped**

## Backend
```
[ERROR] Tests run: 8, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 18.49 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.442 s -- in com.platformops.ApplicationApiTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.444 s -- in com.platformops.DemoSeedTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 7.617 s -- in com.platformops.AuthFlowTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 9.339 s -- in com.platformops.DeploymentPipelineTest
[ERROR] Tests run: 35, Failures: 1, Errors: 0, Skipped: 0
[INFO] BUILD FAILURE
```
### Errors
```
Resolved Exception:
Resolved Exception:
Resolved Exception:
             Type = com.platformops.common.ApiException
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
Resolved Exception:
Resolved Exception:
             Type = com.platformops.common.ApiException
Resolved Exception:
Resolved Exception:
             Type = org.springframework.web.bind.MethodArgumentNotValidException
[ERROR] Tests run: 8, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 18.49 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
[ERROR] com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails -- Time elapsed: 1.652 s <<< FAILURE!
java.lang.AssertionError: Status expected:<403> but was:<400>
[ERROR] Failures: 
[ERROR]   IncidentUserAuditTest.adminManagesPeopleWithGuardrails:75 Status expected:<403> but was:<400>
[ERROR] Tests run: 35, Failures: 1, Errors: 0, Skipped: 0
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:3.5.3:test (default-test) on project platformops-api: There are test failures.
[ERROR] See /home/runner/work/PlatformOps/PlatformOps/Backend/target/surefire-reports for the individual test results.
[ERROR] See dump files (if any exist) [date].dump, [date]-jvmRun[N].dump and [date].dumpstream.
```
### Failing tests
```
-------------------------------------------------------------------------------
Test set: com.platformops.IncidentUserAuditTest
-------------------------------------------------------------------------------
Tests run: 8, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 18.49 s <<< FAILURE! -- in com.platformops.IncidentUserAuditTest
com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails -- Time elapsed: 1.652 s <<< FAILURE!
java.lang.AssertionError: Status expected:<403> but was:<400>
	at org.springframework.test.util.AssertionErrors.fail(AssertionErrors.java:61)
	at org.springframework.test.util.AssertionErrors.assertEquals(AssertionErrors.java:128)
	at org.springframework.test.web.servlet.result.StatusResultMatchers.lambda$matcher$9(StatusResultMatchers.java:640)
	at org.springframework.test.web.servlet.MockMvc$1.andExpect(MockMvc.java:214)
	at com.platformops.IncidentUserAuditTest.adminManagesPeopleWithGuardrails(IncidentUserAuditTest.java:75)
	at java.base/java.lang.reflect.Method.invoke(Method.java:580)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1596)

----
```
## Frontend
```

> frontend@0.0.0 build
> tsc -b && vite build

[36mvite v8.3.1 [32mbuilding client environment for production...[36m[39m
transforming...
✓ 2554 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                          0.89 kB │ gzip:   0.53 kB
dist/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2         7.50 kB
dist/assets/plus-jakarta-sans-vietnamese-wght-normal-qRpaaN48.woff2      8.35 kB
dist/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2              9.00 kB
dist/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2          12.10 kB
dist/assets/bricolage-grotesque-vietnamese-opsz-normal-D9N6E8K1.woff2   12.98 kB
dist/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2         15.19 kB
dist/assets/plus-jakarta-sans-latin-ext-wght-normal-DmpS2jIq.woff2      21.72 kB
dist/assets/plus-jakarta-sans-latin-wght-normal-eXO_dkmS.woff2          27.34 kB
dist/assets/bricolage-grotesque-latin-ext-opsz-normal-IcJDqblK.woff2    30.73 kB
dist/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2             40.40 kB
dist/assets/bricolage-grotesque-latin-opsz-normal-Cre6nC2_.woff2        76.88 kB
dist/assets/index-Bo-ib1tq.css                                          43.39 kB │ gzip:  13.35 kB
dist/assets/index-C4hUBHNU.js                                          959.28 kB │ gzip: 282.06 kB

[33m[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 931ms[39m
```
