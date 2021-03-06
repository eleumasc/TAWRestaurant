import { jwtAuth } from "../middlewares/jwtAuth";
import { userHasRole } from "../middlewares/userHasRole";
import { Route } from ".";
import { addParams } from "../middlewares/addParams";
import { setQuery } from "../middlewares/setQuery";
import { setBody } from "../middlewares/setBody";
import { checkRequest } from "../middlewares/checkRequest";
import { error } from "../helpers/error";
import {
  UserModel,
  WaiterModel,
  CookModel,
  BarmanModel,
  CashierModel,
  BeverageOrderModel,
  FoodOrderModel,
  TableModel
} from "../models";
import { UserRole, User } from "../models/user";
import { isCreateUserForm, isChangePassword } from "../models/forms/user";

const waiters: Route = {
  path: "/waiters",
  subRoutes: [
    {
      path: "/byId/:idU/tables",
      GET: {
        middlewares: [addParams("idU")],
        callback: (req, res) => {
          const idU = req.urlParams.idU;
          TableModel.find({ servedBy: idU }).then(tables => {
            res.json(tables);
          });
        }
      }
    }
  ],
  GET: {
    middlewares: [setQuery(["role"], [UserRole.Waiter])],
    callback: getUsers
  },
  POST: {
    middlewares: [
      userHasRole([UserRole.Cashier]),
      setBody(["role"], [UserRole.Waiter]),
      checkRequest(isCreateUserForm)
    ],
    callback: postUser
  }
};

const cooks: Route = {
  path: "/cooks",
  subRoutes: [
    {
      path: "/byId/:idU/orders",
      middlewares: [addParams("idU")],
      GET: {
        callback: (req, res, next) => {
          const filter: any = { cook: req.urlParams.idU };
          if (req.query.status) filter.status = req.query.status;

          FoodOrderModel.find(filter)
            .populate("food")
            .then(orders => res.json(orders))
            .catch(next);
        }
      }
    }
  ],
  GET: {
    middlewares: [setQuery(["role"], [UserRole.Cook])],
    callback: getUsers
  },
  POST: {
    middlewares: [
      userHasRole([UserRole.Cashier]),
      setBody(["role"], [UserRole.Cook]),
      checkRequest(isCreateUserForm)
    ],
    callback: postUser
  }
};

const barmans: Route = {
  path: "/barmans",
  subRoutes: [
    {
      path: "/byId/:idU/orders",
      middlewares: [addParams("idU")],
      GET: {
        callback: (req, res, next) => {
          const filter: any = { barman: req.urlParams.idU };
          if (req.query.status) filter.status = req.query.status;

          BeverageOrderModel.find(filter)
            .populate("beverage")
            .then(orders => res.json(orders))
            .catch(next);
        }
      }
    }
  ],
  GET: {
    middlewares: [setQuery(["role"], [UserRole.Barman])],
    callback: getUsers
  },
  POST: {
    middlewares: [
      userHasRole([UserRole.Cashier]),
      setBody(["role"], [UserRole.Barman]),
      checkRequest(isCreateUserForm)
    ],
    callback: postUser
  }
};

const cashiers: Route = {
  path: "/cashiers",
  GET: {
    middlewares: [setQuery(["role"], [UserRole.Cashier])],
    callback: getUsers
  },
  POST: {
    middlewares: [
      userHasRole([UserRole.Cashier]),
      setBody(["role"], [UserRole.Cashier]),
      checkRequest(isCreateUserForm)
    ],
    callback: postUser
  }
};

export const users: Route = {
  path: "/users",
  middlewares: [jwtAuth],
  subRoutes: [
    {
      path: "/byId/:idU",
      middlewares: [addParams("idU")],
      subRoutes: [
        {
          path: "/password",
          PUT: {
            middlewares: [
              userHasRole([UserRole.Cashier]),
              checkRequest(isChangePassword)
            ],
            callback: changePassword
          }
        }
      ],
      GET: { callback: getUser },
      DELETE: {
        middlewares: [userHasRole([UserRole.Cashier])],
        callback: deleteUser
      }
    },
    barmans,
    cashiers,
    cooks,
    waiters
  ],
  GET: { callback: getUsers }
};

function getUsers(req, res, next) {
  const filter: any = {};
  if (req.query.role) filter.role = req.query.role;

  UserModel.find(filter)
    .then(users => res.json(users))
    .catch(next);
}

function getUser(req, res, next) {
  UserModel.findOne({ _id: req.urlParams.idU })
    .then(user => {
      if (!user) return res.status(404).json(error("User not found"));
      return res.json(user);
    })
    .catch(next);
}

function postUser(req, res, next) {
  let user: User;
  switch (req.body.role) {
    case UserRole.Barman:
      user = new BarmanModel(req.body);
      break;
    case UserRole.Cashier:
      user = new CashierModel(req.body);
      break;
    case UserRole.Cook:
      user = new CookModel(req.body);
      break;
    case UserRole.Waiter:
      user = new WaiterModel(req.body);
  }

  user.setPassword(req.body.password);
  user
    .save()
    .then(() => res.json(user))
    .catch(next);
}

function changePassword(req, res, next) {
  UserModel.findOne({ _id: req.urlParams.idU })
    .then(user => {
      if (!user) return res.status(404).json(error("User not found"));
      user.setPassword(req.body.password);
      user
        .save()
        .then(() => res.send())
        .catch(next);
    })
    .catch(next);
}

function deleteUser(req, res, next) {
  UserModel.findOne({ _id: req.urlParams.idU })
    .then(user => {
      if (!user) {
        return res.status(404).json(error("User not found"));
      }
      UserModel.deleteOne({ _id: req.urlParams.idU })
        .then(() => res.send())
        .catch(next);
    })
    .catch(next);
}
