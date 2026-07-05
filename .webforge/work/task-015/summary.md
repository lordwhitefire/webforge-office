# AI Code Work: task-015

**Model:** deepseek/deepseek-v4-flash-20260423

**Summary:** Fixed 401 error in auth callback by adding explicit `secret` option to NextAuth configuration and ensuring NEXTAUTH_SECRET is properly loaded.

**Root cause:** The NextAuth configuration was missing the `secret` option, and the NEXTAUTH_SECRET environment variable was not set. This caused JWT token verification to fail on the callback endpoint, resulting in a 401 Unauthorized response.

**Files changed:** 2
