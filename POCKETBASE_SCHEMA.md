# PocketBase Schema Configuration

## Collections Overview

### 1. colorvision_users (Auth Collection)

**Base Fields** (inherited from auth collection):

- `id` (auto)
- `email` (auto)
- `emailVisibility` (auto)
- `username` (auto, optional)
- `verified` (auto)
- `created` (auto)
- `updated` (auto)

**Custom Fields to Add:**

- `colorblindness_type` (Select)
  - Options: `deuteranomaly`, `protanomaly`, `tritanomaly`, `deuteranopia`, `protanopia`, `tritanopia`, `achromatomaly`, `achromatopsia`, `normal`
  - Required: Yes
- `cvd_severity` (Number)
  - Min: 0.0
  - Max: 1.0
  - Required: No
  - Default: null (system uses 0.6 when null)

**API Rules:**

- Create: `@request.auth.id = ""` (allows unauthenticated users to register)
- List/Search: `@request.auth.id != ""`
- View: `@request.auth.id != "" && (@request.auth.id = id || @request.auth.role = "admin")`
- Update: `@request.auth.id = id`
- Delete: `@request.auth.id = id`

---

### 2. colorvision_tests (Base Collection)

**Purpose:** Store individual color discrimination test results

**Fields:**

| Field Name                | Type     | Required | Options/Notes                                                    |
| ------------------------- | -------- | -------- | ---------------------------------------------------------------- |
| `user`                    | Relation | Yes      | → colorvision_users (single)                                     |
| `reference_hex`           | Text     | Yes      | Reference color shown to user                                    |
| `color1_hex`              | Text     | Yes      | First color in comparison                                        |
| `color2_hex`              | Text     | Yes      | Second color in comparison                                       |
| `user_response`           | Select   | Yes      | Options: `same`, `color1`, `color2`                              |
| `is_correct`              | Bool     | No       | Whether user correctly identified the match (calculated on save) |
| `response_time_ms`        | Number   | No       | Time taken to respond in milliseconds                            |
| `expected_confusion_prob` | Number   | No       | Bayesian prior from simulation (0-1)                             |
| `test_type`               | Text     | No       | Will be set to "discrimination" in API layer                     |
| `created`                 | Date     | Auto     | Timestamp                                                        |
| `updated`                 | Date     | Auto     | Timestamp                                                        |

**API Rules:**

- List/Search: `@request.auth.id != "" && user = @request.auth.id`
- View: `@request.auth.id != "" && user = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `@request.auth.id != "" && user = @request.auth.id`
- Delete: `@request.auth.id != "" && user = @request.auth.id`

**Indexes to Create (for performance):**

- Index on `user` field
- Index on `reference_hex` field (for searching by color)
- Composite index on `user + created` (for chronological queries)

---

### 3. colorvision_settings (Base Collection)

**Purpose:** Store user preferences and Bayesian model state

**Fields:**

| Field Name       | Type     | Required | Options/Notes                           |
| ---------------- | -------- | -------- | --------------------------------------- |
| `user`           | Relation | Yes      | → colorvision_users (single, unique)    |
| `preferences`    | JSON     | No       | General user preferences                |
| `bayesian_state` | JSON     | No       | Exported BayesianColorVisionModel state |
| `created`        | Date     | Auto     | Timestamp                               |
| `updated`        | Date     | Auto     | Timestamp                               |

**API Rules:**

- List/Search: `@request.auth.id != "" && user = @request.auth.id`
- View: `@request.auth.id != "" && user = @request.auth.id`
- Create: `@request.auth.id != "" && user = @request.auth.id`
- Update: `@request.auth.id != "" && user = @request.auth.id`
- Delete: `@request.auth.id != "" && user = @request.auth.id`

**Unique Constraint:**

- Ensure `user` field is unique (one settings record per user)

---

## Migration Steps

If you already have data in `colorvision_tests`:

1. **Backup your data** from PocketBase admin panel
2. Add new fields: `color1_hex`, `color2_hex`, `expected_confusion_prob`, `test_type`
3. Update `user_response` field to use new select options
4. If you have old data with different field names, you may need to:
   - Export existing data
   - Transform field names
   - Re-import

---

## Testing the Schema

After updating, test with these API calls:

### Create a test result:

```javascript
await pb.collection('colorvision_tests').create({
	user: userId,
	reference_hex: '#FF0000',
	color1_hex: '#FF0000',
	color2_hex: '#FF1010',
	user_response: 'different_color1',
	response_time_ms: 1500,
	expected_confusion_prob: 0.75,
	test_type: 'discrimination'
});
```

### Query user's tests:

```javascript
const results = await pb.collection('colorvision_tests').getFullList({
	filter: `user = "${userId}"`,
	sort: '-created'
});
```

### Search by color:

```javascript
const colorTests = await pb.collection('colorvision_tests').getFullList({
	filter: `user = "${userId}" && (reference_hex = "#FF0000" || color1_hex = "#FF0000" || color2_hex = "#FF0000")`
});
```
