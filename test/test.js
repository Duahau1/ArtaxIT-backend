let chai = require('chai');
let server = require('../index');
let chai_http = require('chai-http');
const { response } = require('express');

// Assertion style
let token = '';
let faketoken = '';
chai.should();
chai.use(chai_http);

before(function (done) {
  server.on('appStarted', function () {
    done();
  });
});

describe('Test API endpoints', () => {
  /*
     Test /sign_up route
    */

  describe('POST /sign_up', () => {
    it('It should create a new User', (done) => {
      let tempUser = {
        first_name: 'test10',
        last_name: 'test10',
        phone_number: 2087418523,
        company_name: 'myCompany',
        username: 'testUser',
        password: 'secured',
        email: 'van@mcval.net',
      };
      chai
        .request(server)
        .post('/sign_up')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('User is created');
          done();
        });
    });

    it('The user with the same username cannot be inserted into the DB', (done) => {
      let tempUser = {
        first_name: 'test10',
        last_name: 'test10',
        phone_number: 2087418523,
        company_name: 'myCompany',
        username: 'testUser',
        password: 'secured',
        email: 'van@mcval.net',
      };
      chai
        .request(server)
        .post('/sign_up')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Username already exists');
          res.body.should.have.property('status');
          res.body.should.have.property('status').equal('err');
          done();
        });
    });
    it('The username, password, and email cannot be empty', (done) => {
      let tempUser = {
        first_name: 'test10',
        last_name: 'test10',
        phone_number: 2087418523,
        company_name: 'myCompany',
        username: '',
        password: '',
        email: '',
      };
      chai
        .request(server)
        .post('/sign_up')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Username, password, and email cannot be empty');
          res.body.should.have.property('status');
          res.body.should.have.property('status').equal('err');
          done();
        });
    });
  });
  /*
    Test /sign_up route
   */
  describe('POST /log_in', () => {
    it('User with incorrect username cannot log in', (done) => {
      let tempUser = {
        username: 'testUse',
        password: 'secured',
      };
      chai
        .request(server)
        .post('/log_in')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Incorrect username or password');
          done();
        });
    });
    it('User with incorrect password cannot log in', (done) => {
      let tempUser = {
        username: 'testUser',
        password: 'secure',
      };
      chai
        .request(server)
        .post('/log_in')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Incorrect username or password');
          done();
        });
    });
    it('User with empty username or password cannot log in', (done) => {
      let tempUser = {
        username: '',
        password: 'secured',
      };
      chai
        .request(server)
        .post('/log_in')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Incorrect username or password');
          done();
        });
    });
    it('MYSQL Injection should be parameterized', (done) => {
      let tempUser = {
        username: '105 OR 1=1',
        password: 'secured',
      };
      chai
        .request(server)
        .post('/log_in')
        .send(tempUser)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have
            .property('message')
            .equal('Incorrect username or password');
          done();
        });
    });
    it('It should allow valid user to log in', (done) => {
      let tempUser = {
        username: 'testUser',
        password: 'secured',
      };
      chai
        .request(server)
        .post('/log_in')
        .send(tempUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Logged in');
          res.body.should.have.property('token');
          token = 'Bearer ' + res.body.token;
          faketoken = token.substring(0, token.length - 3);
          done();
        });
    });
  });
  /*
     Test /dashboard route
    */
  describe('GET /dashboard', () => {
    it('User who already logged in can query from dashboard ', (done) => {
      chai
        .request(server)
        .get('/dashboard')
        .set('authorization', token)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('subscription');
          res.body.should.have.property('trouble_ticket');
          res.body.trouble_ticket.ticket.should.be.a('array');
          done();
        });
    });
    it('User with tampered token cannot log in ', (done) => {
      chai
        .request(server)
        .get('/dashboard')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with no token cannot log in ', (done) => {
      chai
        .request(server)
        .get('/dashboard')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with token type that is not Bearer cannot log in ', (done) => {
      faketoken = 'token ' + token.split(' ')[1];
      chai
        .request(server)
        .get('/dashboard')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only token type cannot log in ', (done) => {
      chai
        .request(server)
        .get('/dashboard')
        .set('authorization', 'Bearer')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only the JWT token cannot log in ', (done) => {
      chai
        .request(server)
        .get('/dashboard')
        .set('authorization', token.split(' ')[1])
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
  });
  /*
   Test user/information route
  */
  describe('GET /user/information', () => {
    it('User with valid token can retrieve information', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', token)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('first_name');
          res.body.should.have.property('last_name');
          done();
        });
    });
    it('User with tampered token cannot get user information ', (done) => {
      faketoken = token.substring(0, token.length - 3);
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with no token cannot get user information ', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with token type that is not Bearer cannot get user information', (done) => {
      faketoken = 'token ' + token.split(' ')[1];
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only token type cannot log in ', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', 'Bearer')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only the JWT token cannot retrieve information ', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', token.split(' ')[1])
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
  });
  /*
  Test user/edit route
 */
  describe('PATCH /user/edit', () => {
    it('User with valid token can patch information', (done) => {
      let temp = {
        first_name: 'first',
        last_name: 'last',
        phone_number: 22222,
        company_name: 'artaxIt',
      };
      chai
        .request(server)
        .patch('/user/edit')
        .set('authorization', token)
        .send(temp)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('first_name');
          res.body.should.have.property('last_name');
          done();
        });
    });
    it('User with tampered token cannot edit information ', (done) => {
      faketoken = token.substring(0, token.length - 3);
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with no token cannot edit information', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with token type that is not Bearer cannot edit information', (done) => {
      faketoken = 'token ' + token.split(' ')[1];
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', faketoken)
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only token type cannot edit information', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', 'Bearer')
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
    it('User with only the JWT token cannot retrieve information ', (done) => {
      chai
        .request(server)
        .get('/user/information')
        .set('authorization', token.split(' ')[1])
        .end((err, res) => {
          res.body.should.be.a('object');
          res.body.should.have.property('message');
          res.body.should.have.property('message').equal('Please log in');
          done();
        });
    });
  });
});
