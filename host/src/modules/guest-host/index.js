// We communicate network details to the guest application through this
// interface

const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

const sharedcache = require("../sharedcache");

// This port needs to be the same as the port that is used in api-spoof
const port = 5001;

// Log requests
app.use(async (ctx, next) => {
  await next();
  console.log(`${Date.now()}: ${ctx.method} ${ctx.url}`);
});

// Default info route
router.get("/", async ctx => {
  ctx.status = 200;
  ctx.body = "Guest API is working, call this API using your application"
});

// List servers in network
router.get("/servers/:name?", async (ctx, next) => {
  if (ctx.params.name) {
    const name = ctx.params.name.trim().toLowerCase();
    const serers = ??.filter(s => s.name.trim().toLowerCase() == name);
    ctx.status = 200;
    ctx.body = spoof
  } else {
    ctx.status = 200;
    ctx.body = spoof;
  }
});

router.get("/")

app.use(router.routes());
app.listen(port);

console.log("CrissCross guest API running on port", port);
