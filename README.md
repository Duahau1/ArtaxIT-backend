<h1>ArtaxIt</h1>

## Contributors

[![](https://avatars1.githubusercontent.com/u/35185555?s=50)](https://github.com/Duahau1)
[![](https://avatars1.githubusercontent.com/u/24856511?s=50)](https://github.com/aliabediweb)
[![](https://avatars0.githubusercontent.com/u/47285330?s=50)](https://github.com/juanluisja1)


## Endpoint

<code>https://mcval.herokuapp.com/</code>

Content-type should all be JSON
<hr>

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
</table>
