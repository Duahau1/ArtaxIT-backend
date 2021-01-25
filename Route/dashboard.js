const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//Route Configuration
function authenticate(req, res, next) {
    if (req.headers.cookie) {
        let token = req.headers.cookie.split('=')[1];
        jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
            if (err) {
                res.send('Please log in');
            }
            else {
                res.body = payload;
            }
        })
        next();
    }
    else {
        res.send('Please log in');
    }
}
function payPalLogIn(sub_type){
    
}
router.use(authenticate);

//Route
router.get('/', (req, res) => {
    res.json(res.body)
})

router.post('/subscription/purchase', (req, res) => {
  switch(req.params.type){
    case 'careBasic':
        break;
    case 'carePlus':
        break;
    case 'carePro':
        break;
  }

  res.json({
      'status':'good',
      'message':'purchased'
  }).status(200);  
})
router.get('/subscription/cancel',(req,res)=>{

})
module.exports = router;