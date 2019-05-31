import { userHasRole } from "../middlewares/userHasRole";
import { error } from "../helpers/error";
import { MenuItemModel } from "../models";
import { UserRole } from "../models/user";
import {
  isCreateMenuItemForm,
  isChangeMenuItemForm
} from "../models/forms/menuItem";
import { MenuItem, isMenuItemKind } from "../models/menuItem";
import { Route } from ".";
import { addParams } from "../middlewares/addParams";

export const menu: Route = {
  path: "/menu",
  subRoutes: [
    {
      path: "/byId/:id",
      middleware: [addParams("id")],
      GET: { callback: getMenuItemById },
      DELETE: {
        middleware: [userHasRole([UserRole.Cashier])],
        callback: deleteMenuItem
      }
    }
  ],
  GET: { callback: getMenuItems },
  POST: {
    middleware: [userHasRole([UserRole.Cashier])],
    callback: postMenuItem
  },
  PUT: {
    middleware: [userHasRole([UserRole.Cashier])],
    callback: putMenuItem
  }
};

function getMenuItems(req, res, next) {
  const { name, price, preparationTime, kind } = req.query;
  const filter = {};
  if (name && typeof name === "string") {
    filter["name"] = name;
  }
  if (price && typeof price === "number") {
    filter["price"] = price;
  }
  if (preparationTime && typeof preparationTime === "number") {
    filter["preparationTime"] = preparationTime;
  }
  if (kind && isMenuItemKind(kind)) {
    filter["kind"] = kind;
  }

  MenuItemModel.find(filter)
    .then(menuItems => {
      return res.json(menuItems);
    })
    .catch(err => {
      return next(err);
    });
}

function getMenuItemById(req, res, next) {
  MenuItemModel.findOne({ _id: req.params.id })
    .then(menuItem => {
      if (!menuItem) {
        return res.status(404).json(error("MenuItem not found"));
      }
      return res.json(menuItem);
    })
    .catch(err => {
      return next(err);
    });
}

function postMenuItem(req, res, next) {
  if (!isCreateMenuItemForm(req.body)) {
    return res.status(400).json(error("Bad request"));
  }
  let menuItem: MenuItem;
  menuItem = new MenuItemModel(req.body);
  menuItem
    .save()
    .then(() => {
      return res.json(menuItem);
    })
    .catch(err => {
      return next(err);
    });
}

function putMenuItem(req, res, next) {
  if (!isChangeMenuItemForm(req.body)) {
    return res.status(400).json(error("Bad request"));
  }
  MenuItemModel.findOne({ _id: req.params.id })
    .then((menuItem: MenuItem) => {
      if (!menuItem) {
        return res.status(404).json(error("MenuItem not found"));
      }
      const { name, price, preparationTime, kind } = req.body;
      if (name) menuItem.name = name;
      if (price) menuItem.price = price;
      if (preparationTime) menuItem.preparationTime = preparationTime;
      if (kind) menuItem.kind = kind;
      menuItem
        .save()
        .then(() => {
          return res.send();
        })
        .catch(err => {
          return next(err);
        });
    })
    .catch(err => {
      return next(err);
    });
}

function deleteMenuItem(req, res, next) {
  MenuItemModel.findOne({ _id: req.params.id })
    .then(menuItem => {
      if (!menuItem) {
        return res.status(404).json(error("MenuItem not found"));
      }
      MenuItemModel.deleteOne({ _id: req.params.id })
        .then(() => {
          return res.send();
        })
        .catch(err => {
          return next(err);
        });
    })
    .catch(err => {
      return next(err);
    });
}
