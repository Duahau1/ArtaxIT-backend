const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const connection = require('../db.js');
const { route } = require('./troubleTicket.js');
const MAXIMUM_USER_PER_PAGE = 2;
const PRODUCTION_URL = 'https://mcval.herokuapp.com/admin/retrieve_users';
let pagination = [];
function getUserByPage(req, res, currIndex) {
  let startIndex = (currIndex - 1) * MAXIMUM_USER_PER_PAGE;
  let endIndex = startIndex + MAXIMUM_USER_PER_PAGE;
  let retVal = {
    status: 'good',
    next:
      currIndex < Math.ceil(pagination.length / MAXIMUM_USER_PER_PAGE)
        ? `${PRODUCTION_URL}?page=${currIndex + 1}`
        : null,
    prev: currIndex > 1 ? `${PRODUCTION_URL}?page=${currIndex - 1}` : null,
    totalPage: Math.ceil(pagination.length / MAXIMUM_USER_PER_PAGE),
    currentPage: currIndex,
    users: pagination.slice(startIndex, endIndex),
  };
  res.json(retVal);
}
function retrieveUsers(req, res, currIndex = 1) {
  let sql =
    'SELECT customers.id as user_id,plan_id,DATE_ADD(start_period, interval MONTH(CURRENT_TIMESTAMP())-MONTH(start_period) month) as next_billing_day,first_name,last_name,phone_number,company_name,email,trouble_tickets.id as ticket_id,issue,description, priority,image_link,status FROM customers left join trouble_tickets on customers.id=trouble_tickets.customer left join new_subscriptions on customers.id=new_subscriptions.user_id  WHERE trouble_tickets.id IS NOT NULL';
  connection.query(sql, (err, data) => {
    if (err) {
      res.json({
        status: 'err',
        message: 'Error',
      });
    } else {
      let map = new Map();
      data.forEach((value) => {
        let retModel = {
          first_name: value.first_name,
          last_name: value.last_name,
          email: value.email,
          company_name: value.company_name,
          phone_number: value.phone_number,
          plan_id: value.plan_id,
          next_billing_day: value.next_billing_day,
          tickets: [
            {
              ticket_id: value.ticket_id,
              description: value.description,
              priority: value.priority,
              status: value.status,
            },
          ],
        };
        if (map.get(value.user_id) == null) {
          map.set(value.user_id, retModel);
        } else if (map.get(value.user_id) != null) {
          let tempArr = map.get(value.user_id);
          tempArr.tickets.push(retModel.tickets[0]);
          map.set(value.user_id, tempArr);
        }
      });
      pagination = Array.from(map).map(([user_id, info]) => ({
        user_id,
        info,
      }));
      let startIndex = (currIndex - 1) * MAXIMUM_USER_PER_PAGE;
      let endIndex = startIndex + MAXIMUM_USER_PER_PAGE;
      let retVal = {
        status: 'good',
        next:
          currIndex < Math.ceil(pagination.length / MAXIMUM_USER_PER_PAGE)
            ? `${PRODUCTION_URL}?page=${currIndex + 1}`
            : null,
        prev: currIndex > 1 ? `${PRODUCTION_URL}?page=${currIndex - 1}` : null,
        totalPage: Math.ceil(pagination.length / MAXIMUM_USER_PER_PAGE),
        currentPage: currIndex,
        users: pagination.slice(startIndex, endIndex),
      };
      res.json(retVal);
    }
  });
}
function adminAuthenticate(req, res, next) {
  if (req.headers['authorization']) {
    let token = req.headers['authorization'].split(' ')[1];
    jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
      if (err) {
        res
          .json({
            status: 'err',
            message: 'Please log in',
          })
          .status(404);
      } else if (payload.user_role == 'admin') {
        req.body.id = payload.user_id;
        next();
      } else {
        res
          .json({
            status: 'err',
            message: 'Unauthorized access',
          })
          .status(404);
      }
    });
  } else {
    res
      .json({
        status: 'err',
        message: 'Please log in',
      })
      .status(404);
  }
}
router.use(adminAuthenticate);
router.post('/close_ticket', (req, res) => {
  let sql = "UPDATE trouble_tickets SET status='close' WHERE id=?";
  connection.query(sql, [req.body.ticket_id], (err, data) => {
    if (err) {
      console.log(e);
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      res.json({
        status: 'good',
        message: 'The ticket is closed',
      });
    }
  });
});
router.post('/reopen_ticket', (req, res) => {
  let sql = "UPDATE trouble_tickets SET status='open' WHERE id=?";
  connection.query(sql, [req.body.ticket_id], (err, data) => {
    if (err) {
      console.log(e);
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      res.json({
        status: 'good',
        message: 'The ticket is reopened',
      });
    }
  });
});
router.get('/get_tickets', (req, res) => {
  let sql =
    'SELECT id as ticket_id,customer,issue,status FROM trouble_tickets order by id';
  if (req.query.status) {
    if (req.query.status == 'open') {
      sql += " WHERE status='open'";
    } else if (req.query.status == 'close') {
      sql += " WHERE status='close'";
    }
  }
  connection.query(sql, (err, data) => {
    if (err) {
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      res.json({
        status: 'good',
        tickets: data,
      });
    }
  });
});
router.get('/getselectedTickets/:id', (req, res) => {
  let sql =
    'SELECT customers.id as user_id,plan_id,DATE_ADD(start_period, interval MONTH(CURRENT_TIMESTAMP())-MONTH(start_period) month) as next_billing_date,first_name,last_name,phone_number,company_name,email,trouble_tickets.id as ticket_id,issue,description, priority,image_link,status FROM customers left join trouble_tickets on customers.id=trouble_tickets.customer left join new_subscriptions on customers.id=new_subscriptions.user_id  WHERE trouble_tickets.id IS NOT NULL AND trouble_tickets.id =?';
  connection.query(sql, [req.params.id], (err, data) => {
    if (err) {
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      res.json({
        status: 'good',
        tickets: data[0],
      });
    }
  });
});
router.post('/remove_ticket', (req, res) => {
  let sql = 'DELETE FROM trouble_tickets WHERE id=?';
  connection.query(sql, [req.body.ticket_id], (err, data) => {
    if (err) {
      console.log(e);
      res
        .json({
          status: 'err',
          message: 'Error',
        })
        .status(404);
    } else {
      res.json({
        status: 'good',
        message: 'The ticket is removed',
      });
    }
  });
});
router.get('/retrieve_users', (req, res) => {
  if (req.query.reload) {
    if (req.query.page) {
      retrieveUsers(req, res, Number(req.query.page));
    } else {
      retrieveUsers(req, res);
    }
  } else if (!req.query.reload && req.query.page && pagination.length > 0) {
    getUserByPage(req, res, Number(req.query.page));
  } else {
    retrieveUsers(req, res);
  }
});
router.get('/getuser_info/:id', (req, res) => {
  let sql =
    'SELECT customers.id as user_id,plan_id,DATE_ADD(start_period, interval MONTH(CURRENT_TIMESTAMP())-MONTH(start_period) month) as next_billing_day,first_name,last_name,phone_number,company_name,email,trouble_tickets.id as ticket_id,issue,description, priority,image_link,status FROM customers left join trouble_tickets on customers.id=trouble_tickets.customer left join new_subscriptions on customers.id=new_subscriptions.user_id  WHERE trouble_tickets.id IS NOT NULL AND customers.id=? ';
  connection.query(sql, [req.params.id], (err, data) => {
    if (err) {
      res.json({
        status: 'err',
        message: 'Error',
      });
    } else {
      let map = new Map();
      data.forEach((value) => {
        let retModel = {
          first_name: value.first_name,
          last_name: value.last_name,
          email: value.email,
          company_name: value.company_name,
          phone_number: value.phone_number,
          plan_id: value.plan_id,
          next_billing_day: value.next_billing_day,
          tickets: [
            {
              ticket_id: value.ticket_id,
              description: value.description,
              priority: value.priority,
              status: value.status,
            },
          ],
        };
        if (map.get(value.user_id) == null) {
          map.set(value.user_id, retModel);
        } else if (map.get(value.user_id) != null) {
          let tempArr = map.get(value.user_id);
          tempArr.tickets.push(retModel.tickets[0]);
          map.set(value.user_id, tempArr);
        }
      });
      pagination = Array.from(map).map(([user_id, info]) => ({
        user_id,
        info,
      }));
      res.json(pagination);
    }
  });
});
router.get('/getAll_Users', (req, res) => {
  let sql =
    'SELECT distinct customers.id,customers.email,customers.first_name,customers.company_name FROM customers';
  if (req.query.status) {
    if (req.query.status == 'open') {
      sql +=
        " LEFT JOIN trouble_tickets on customers.id=trouble_tickets.customer WHERE trouble_tickets.id IS NOT NULL AND status='open'";
    } else if (req.query.status == 'close') {
      sql +=
        " LEFT JOIN trouble_tickets on customers.id=trouble_tickets.customer WHERE trouble_tickets.id IS NOT NULL AND status='close'";
    }
  }
  connection.query(sql, (err, result) => {
    if (err || result.length <= 0) {
      console.log(err);
      res
        .json({
          status: 'err',
          message: 'Error in the server',
        })
        .status(404);
    } else {
      res
        .json({
          status: 'good',
          user: result,
        })
        .status(200);
    }
  });
});
module.exports = router;
