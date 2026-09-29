# Home Chef Category Requests

## Overview

Home chefs can ask an admin to add a category to the shared home-chef category list. Requests are not published until an admin approves them.

## Chef Workflow

- Open **Category Requests** from the Home Chef sidebar or visit `#/chef/categoryrequest`.
- Select a category type, enter a name and description, optionally add subcategories, and upload at least one image.
- Submit the request. The form compresses selected images before sending them.
- Track requests in table or card view. Search and status filters are available.
- Pending requests can be edited or deleted. Approved and rejected requests are read-only.

## Admin Workflow

- Open **Home Chef Categories** and select **CR** in the admin top header to open the request table.
- Review the category image, type, requesting chef, and description.
- Approve a request to add it to the shared `home_chef_categorys` table, or reject it to keep it unpublished.

## Request Status

- `Pending`: waiting for admin review; chef can edit or delete.
- `Approved`: published as a shared home-chef category; chef cannot edit or delete the request.
- `Rejected`: not published; chef cannot edit or delete the request.

If an admin later deletes a published category, its approved request is omitted from the chef's request list. New approvals store the published category ID. Legacy approvals are matched against their category fields.

## API

All endpoints are under `/api/category-requests` and require a valid bearer token.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/` | `chef`, `homechef` | Submit a request |
| `GET` | `/mine` | `chef`, `homechef` | List the signed-in chef's requests |
| `PUT` | `/:id` | `chef`, `homechef` | Update an owned pending request |
| `DELETE` | `/:id` | `chef`, `homechef` | Delete an owned pending request |
| `GET` | `/` | `admin` | List requests for review |
| `PATCH` | `/:id` | `admin` | Approve or reject a pending request |

Chef update and delete operations are restricted by both request owner and `Pending` status. Admin review accepts `Approved` or `Rejected` and prevents reviewing the same request twice.

## Database

Backend startup migrations create `home_chef_categorys` and `home_chef_category_requests`. The request table stores category details, image and subcategory JSON, chef identity, review status, review note, and the published category ID when approved.

## Source Locations

- Chef request dashboard and form: `frontend/src/HomeChef/Pages/CategoryRequestPage.jsx` and `frontend/src/HomeChef/Pages/CategoryRequest.jsx`
- Admin request table and review popup: `frontend/src/Admin/Pages/HomeChefCategories.jsx`
- API routes and controller: `backend/src/routes/categoryRequests.js` and `backend/src/controllers/categoryRequestController.js`
- Startup schema: `backend/src/config/migrations.js`, called from `backend/index.js`