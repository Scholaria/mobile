# API Documentation

## Database
### Tables

#### arxiv_papers
| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| paper_id | string | ArXiv paper identifier |
| title | string | Paper title |
| abstract | text | Paper abstract |
| published | timestamp | Publication date |
| authors | string[] | Array of author names |
| comment | text | Additional comments |
| category | string | Paper category |
| link | string | URL to paper |

#### paper_inference - only for some papers, not all papers have infrence
| Column | Type | Description |
|--------|------|-------------|
| paper_id | string | ArXiv paper PRIMARY KEY |
| summary | text | Generated summary |
| keywords | string[] | Array of keywords |
| organizations | string[] | Array of organizations |


#### users
| Column | Type | Description |
|--------|------|-------------|
| clerk_id | string | Clerk authentication ID |
| name | string | User's full name |
| email | string | User's email address |
| affiliations | string[] | User's Affiliations |
| interests | string[] | Array of user interests |
| role | string | Role of user |
| permisions | string | Permissions of user (Admin / Researcher / User) defaulted to User|
| profile_image_url | TEXT | Image file to a storage service |


#### user_likes
| Column | Type | Description |
|--------|------|-------------|
| user_id | string | Foreign key to users |
| paper_id | id | Foreign key to arxiv_papers |

#### user_saves
| Column | Type | Description |
|--------|------|-------------|
| user_id | string | Foreign key to users |
| paper_id | id | Foreign key to arxiv_papers |

#### user_follow_authors
| Column | Type | Description |
|--------|------|-------------|
| user_id | string | Foreign key to users |
| author | string | Author name to follow |

#### user_follow_categories
| Column | Type | Description |
|--------|------|-------------|
| user_id | string | Foreign key to users |
| category | string | Category to follow |

#### user_follow_organizations
| Column | Type | Description |
|--------|------|-------------|
| user_id | string | Foreign key to users |
| organization | string | Organization to follow |


## API Endpoints

### User Endpoints

#### Get User by ID
```http
GET /api/user/:id
```
Returns user information by ID.

**Response Codes**
- `200 OK`: User found successfully
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "org": "University of Example",
  "interests": ["machine learning", "computer vision"]
}
```


#### Create User
```http
POST /api/user
```
Create a new user.

**Response Codes**
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid request body or missing required fields
- `409 Conflict`: User with same email already exists
- `500 Internal Server Error`: Server error occurred

**Request Body**
```json
{
  "name": "John Doe", - required
  "email": "john@example.com", - required
  "clerk_id": "clerk_123", - required
  "org": null,
  "interests": null
}
```

**Response**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "org": null,
  "interests": null
}
```

#### Update User
```http
PATCH /api/user/:id
```
Update user information.

**Response Codes**
- `200 OK`: User updated successfully
- `400 Bad Request`: Invalid request body
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Request Body**
```json
{
  "affiliations": ["University A", "Organization B"],
  "interests": ["deep learning", "nlp"],
  "role": "Researcher",
  "profile_image_url": "https://example.com/image.jpg"
}
```

**Response**
```json
{
  "data": {
    "clerk_id": "clerk_123",
    "name": "John Doe",
    "email": "john@example.com",
    "affiliations": ["University A", "Organization B"],
    "interests": ["deep learning", "nlp"],
    "role": "Researcher",
    "profile_image_url": "https://example.com/image.jpg"
  }
}
```

#### Delete User
```http
DELETE /api/user/:id
```
Delete a user by ID.

**Response Codes**
- `200 OK`: User deleted successfully
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "data": {
    "clerk_id": "clerk_123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Liked Papers
```http
GET /api/users/:id/likes
```
Returns all papers liked by the user.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "papers": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Saved Papers
```http
GET /api/users/:id/saves
```
Returns all papers saved by the user.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "papers": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Recommended Papers
```http
GET /api/recommendation/:id
```
Returns personalized paper recommendations for the user.

**Response Codes**
- `200 OK`: Recommendations retrieved successfully
- `404 Not Found`: User with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "data": [
    {
        "id": "2101.12345",
        "title": "Example Paper",
        "abstract": "Paper abstract...",
        "published": "2021-01-01T00:00:00Z",
        "authors": ["Author 1", "Author 2"]
    }
  ],
  "error": null
}
```

### Paper Endpoints

#### Get All Papers
```http
GET /api/paper
```
Returns all papers.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "data": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Paper by ID
```http
GET /api/paper/:id
```
Returns detailed information about a specific paper.

**Response Codes**
- `200 OK`: Paper retrieved successfully
- `404 Not Found`: Paper with specified ID does not exist
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "data": {
    "id": "2101.12345",
    "title": "Example Paper",
    "abstract": "Paper abstract...",
    "published": "2021-01-01T00:00:00Z",
    "authors": ["Author 1", "Author 2"],
    "comment": "Additional comments",
    "category": "cs.AI",
    "link": "https://arxiv.org/abs/2101.12345",
    "summary": "Generated summary...",
    "keywords": ["keyword1", "keyword2"],
    "organizations": ["Org 1", "Org 2"]
  }
}
```

#### Search Papers
```http
GET /api/paper/search?query=<search_term>
```
Search for papers by title, authors, or categories.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `query`: Search term (required)

**Response**
```json
{
  "data": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Users Who Liked Paper
```http
GET /api/paper/likes?paperId=<paper_id>
```
Returns all users who liked a specific paper.

**Response Codes**
- `200 OK`: Users retrieved successfully
- `400 Bad Request`: Missing paper ID
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `paperId`: Paper ID (required)

**Response**
```json
{
  "data": [
    {
      "id": "clerk_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

#### Get Users Who Saved Paper
```http
GET /api/paper/saves?paperId=<paper_id>
```
Returns all users who saved a specific paper.

**Response Codes**
- `200 OK`: Users retrieved successfully
- `400 Bad Request`: Missing paper ID
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `paperId`: Paper ID (required)

**Response**
```json
{
  "data": [
    {
      "id": "clerk_123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Trends Endpoints

#### Get Trend Statistics
```http
GET /api/trends/stats?period=<period>
```
Returns statistics about paper trends over a specific period.

**Response Codes**
- `200 OK`: Statistics retrieved successfully
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `period`: Time period for statistics (day, week, month, all). Defaults to "week"

**Response**
```json
{
  "data": [
    {
      "date": "2023-01-01",
      "likes": 10,
      "saves": 5,
      "views": 100
    },
    {
      "date": "2023-01-02",
      "likes": 15,
      "saves": 8,
      "views": 150
    }
  ]
}
```

#### Get Top Papers
```http
GET /api/trends/top?period=<period>
```
Returns top papers for a specified period.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `400 Bad Request`: Missing period parameter
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `period`: Time period (required)

**Response**
```json
{
  "data": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Hot Papers
```http
GET /api/trends/hot?period=<period>
```
Returns trending (hot) papers for a specified period.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `400 Bad Request`: Missing period parameter
- `500 Internal Server Error`: Server error occurred

**Query Parameters**
- `period`: Time period (required)

**Response**
```json
{
  "data": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

#### Get Newest Papers
```http
GET /api/trends/new
```
Returns the newest papers.

**Response Codes**
- `200 OK`: Papers retrieved successfully
- `500 Internal Server Error`: Server error occurred

**Response**
```json
{
  "data": [
    {
      "id": "2101.12345",
      "title": "Example Paper",
      "abstract": "Paper abstract...",
      "published": "2021-01-01T00:00:00Z",
      "authors": ["Author 1", "Author 2"]
    }
  ]
}
```

