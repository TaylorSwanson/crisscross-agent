const Koa = require("koa");
const Router = require("koa-router");

const app = new Koa();
const router = new Router();

const spoof = require("./spoof.json");

const port = 5001;

// Log requests
app.use(async (ctx, next) => {
  await next();
  console.log(`${Date.now()}: ${ctx.method} ${ctx.url}`);
});

// Default info route
router.get("/", async ctx => {
  ctx.status = 200;
  ctx.body = "API spoof is working, call this API using your application"
});

// List servers
router.get("/servers/:name?", async (ctx, next) => {
  if (ctx.params.name) {
    const name = ctx.params.name.trim().toLowerCase();
    ctx.status = 200;
    ctx.body = spoof.filter(s => s.name.trim().toLowerCase() == name);
  } else {
    ctx.status = 200;
    ctx.body = spoof;
  }
});

app.use(router.routes());
app.listen(port);

console.log("CrissCross API spoof running on port", port);
