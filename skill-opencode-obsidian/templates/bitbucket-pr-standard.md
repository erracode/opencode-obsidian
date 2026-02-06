---
name: bitbucket-pr-standard
description: PR completo para features en Bitbucket
triggers: ["pr", "pull-request", "bitbucket", "feature"]
language: en
---

## PR Description

### What?
JIRA task that this solves, with optional additional comments

**JIRA TASK:** {{jira_task}}

### Why?
Not every task needs a code solution, make sure that your code actually has a reason

**THIS CODE IS REQUIRED BECAUSE:** {{razon_codigo}}

### How?
How does your code solve the issue?

**THIS CODE DOES:** {{que_hace_codigo}}

### Testing?
What tests were run and what was the result

**I HAVE TESTED:** {{testing}}

### Anything Else?
Optional comments

{{comentarios_adicionales}}

---

**Azure ID:** {{azure_id}} | **Branch:** {{rama}} | **Repo:** {{repositorio}}
