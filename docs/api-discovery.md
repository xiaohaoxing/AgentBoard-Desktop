# API Discovery

## Endpoint

- **URL**: `GET https://agentboard.cc/api/leaderboard/bootstrap`
- **Auth**: Supabase cookie split across two cookies:
  - `sb-vtgpooterdbtqcjvbvgl-auth-token.0`
  - `sb-vtgpooterdbtqcjvbvgl-auth-token.1`
- **Full response saved to**: `docs/api-response-bootstrap.json`

## Response Schema

```
{
  timeNavigator: {
    defaultGranularity: "day",
    defaultPeriodId: "day:2026-04-22",
    allTimeId: "alltime",
    chipsByGranularity: { day: [...], week: [...], month: [...] }
  },
  profileMap: {
    "<user_id>": {
      handle: string,
      display_name: string,
      avatar_url: string | null,
      role: string,
      country_code: string | null
    }
  },
  memberships: [{
    user_id, org_id, slug, handle, name, kind, avatar_url, ...
  }],
  snapshot: {
    periodId: "day:2026-04-22",
    people: [{
      user_id, handle, display_name, avatar_url, role, country_code,
      coding_time_mins, ai_time_mins, session_duration_sum_mins,
      total_tokens, sessions, lines_added, lines_removed,
      rank, boost_ratio,
      team_name, team_avatar_url, team_slug, team_handle,
      social_x, social_github, social_linkedin, social_website
    }],
    teams: [{
      rank, organization_id, slug, handle, name, kind, avatar_url,
      member_count, active_members,
      coding_time_mins, ai_time_mins, total_tokens, sessions,
      lines_added, lines_removed, boost_ratio,
      topMembers: [{ user_id, avatar_url, initials, coding_time_mins }]
    }]
  }
}
```

## Current User Detection

The Supabase cookie (`sb-vtgpooterdbtqcjvbvgl-auth-token.0`) contains a base64-encoded
JSON with `user.id` field. Parse it to get the current user's UUID, then match against
`snapshot.people[].user_id`.

Cookie format: `base64-<base64(JSON)>` where JSON has shape:
```
{ access_token, token_type, expires_in, refresh_token, user: { id, email, ... } }
```
