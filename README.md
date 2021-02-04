<h1>ArtaxIt</h1>

## Contributors

[![](https://avatars1.githubusercontent.com/u/35185555?s=50)](https://github.com/Duahau1)
[![](https://avatars.githubusercontent.com/u/68358647?s=50)](https://github.com/aliabediweb)
[![](https://avatars.githubusercontent.com/u/77358045?s=50)](https://github.com/juanluisja1)

## Endpoint

<code>https://mcval.herokuapp.com/</code>

Content-type should all be JSON

## Available Route 

<table>

<tr>
<th>
HTTP Method
</th>
 <th>
Route
</th>
 <th>
Request Body
</th>
<th>
Request Param
</th>
<th>
Example
</th>
 <th>
Response
</th>
</tr>

<tr>
<td>POST</td>
<td>/sign_up</td>
<td>:heavy_check_mark:</td>
<td>:x:</td>
<td>

```json
{
    "first_name":"test5",
    "last_name":"test5",
    "phone_number":2087418523,
    "company_name":"myCompany",
    "username":"test8",
    "password":"secured",
    "email":"myemail@gmail.com"
}
```
</td>
<td>
 
 ```json
 {
   "status": "good",
   "message": "User is created"
}
 ```
 </td>
 
</tr>
<tr>
<td>POST</td>
<td>/log_in</td>
<td>:heavy_check_mark:</td>
<td>:x:</td>
<td>
 
```json
{
   "username":"test8",
   "password":"secured"
}
```
</td>
<td>
 
 ```json
 {
    "status": "good",
    "username": "test8",
    "token":     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxNCwidXNlcm5hbWUiOiJ0ZXN0OCIsImNvbXBhbnlfbmFtZSI6Im15Q29tcGFueSIsImlhdCI6MTYxMjM5NzM3MywiZXhwIjoxNjEyNDgzNzczfQ.C0CRR1vQC_v-CY53GllZioRHMo05TC9gh_j4N2FJvZc",
    "company_name": "myCompany",
    "message": "Logged in"
}
```
</td>
</tr>
<tr>
<td>GET</td>
<td>/log_out</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "status": "good",
    "message": "Logged out"
}
```
 </td>
</tr>

<tr>
<td>GET</td>
<td>/dashboard</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "subscription": {
        "status": "good",
        "plan_status": "Active",
        "userID": 14,
        "planName": "careBasic",
        "next_billing_day": "2021-01-31T07:00:00.000Z"
    },
    "trouble_ticket": {
        "status": "good",
        "ticket": [
            {
                "id": 1,
                "issue": "test1",
                "description": "test wrong",
                "datetime": "2021-02-01T08:46:52.000Z",
                "priority": 0,
                "status": 0,
                "customer": 14,
                "published_at": null,
                "created_by": null,
                "updated_by": null,
                "created_at": "2021-02-01T08:46:52.000Z",
                "updated_at": "2021-02-01T08:46:52.000Z",
                "image_link": null
            }
        ]
    }
}
```
 </td>
</tr>
<tr>
<td>GET</td>
<td>/dashboard/subscription/createAgreement/:id</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "url": "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-4073148070L"
}
```
 </td>
</tr>
 </td>
</tr>

<tr>
<td>GET</td>
<td>/dashboard/subscription/purchase</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "status": "good",
    "plan": "careBasic",
    "next_billing_day": "2021-01-31"
}
```
 </td>
</tr>

<tr>
<td>GET</td>
<td>/dashboard/subscription/cancel</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "status": "good",
    "message": "successfully delete your subscription"
}
```
 </td>
</tr>
<tr>

<td>POST</td>
<td>/ticket/create</td>
<td>:heavy_check_mark:</td>
<td>:x:</td>
<td>
<pre>

```json
{
    "issue":"error in test5",
    "description":"something is wrong with the index file",
    "priority":1,
    "status":1
}
```
</pre>
</td>
<td>

```json
{
     "status": "good",
     "message": "Ticket create successfully"
}
```
 </td>
</tr>
<tr>
<td>GET</td>
<td>/ticket/view</td>
<td>:x:</td>
<td>:x:</td>
<td>
<pre>
null
</pre>
</td>
<td>

```json
{
    "status": "good",
        "ticket": [
            {
                "id": 1,
                "issue": "test1",
                "description": "test wrong",
                "datetime": "2021-02-01T08:46:52.000Z",
                "priority": 0,
                "status": 0,
                "customer": 14,
                "published_at": null,
                "created_by": null,
                "updated_by": null,
                "created_at": "2021-02-01T08:46:52.000Z",
                "updated_at": "2021-02-01T08:46:52.000Z",
                "image_link": null
            }
        ]
}
```
 </td>
</tr>
<tr>
<td>PATCH</td>
<td>/user/edit</td>
<td>:heavy_check_mark:</td>
<td>:x:</td>
<td>
<pre>

```json
{
 "first_name": "first",
 "last_name": "last",
 "phone_number": 22222,
 "company_name": "artaxIt"
}
```
</pre>
</td>
<td>

```json
{
    "status": "good",
    "first_name": "first",
    "last_name": "last",
    "phone_number": 22222,
    "company_name": "artaxIt",
    "message": "Successfully update user info"
}
```
 </td>
</tr> 
</table>
