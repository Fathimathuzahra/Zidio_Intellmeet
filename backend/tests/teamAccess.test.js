const assert = require("node:assert/strict");
const test = require("node:test");
const { canAccessTeam, canManageTeam } = require("../utils/teamAccess");

const team = {
  owner: "owner-1",
  members: [
    { user: "owner-1", role: "admin" },
    { user: "team-admin", role: "admin" },
    { user: "member-1", role: "member" },
  ],
};

test("team access is restricted to members, owners, and global administrators", () => {
  assert.equal(canAccessTeam(team, { id: "owner-1", role: "member" }), true);
  assert.equal(canAccessTeam(team, { id: "member-1", role: "member" }), true);
  assert.equal(canAccessTeam(team, { id: "outsider", role: "member" }), false);
  assert.equal(canAccessTeam(team, { id: "admin-user", role: "admin" }), true);
});

test("team management is limited to owners and team or global administrators", () => {
  assert.equal(canManageTeam(team, { id: "owner-1", role: "member" }), true);
  assert.equal(canManageTeam(team, { id: "team-admin", role: "member" }), true);
  assert.equal(canManageTeam(team, { id: "member-1", role: "member" }), false);
  assert.equal(canManageTeam(team, { id: "admin-user", role: "admin" }), true);
});
