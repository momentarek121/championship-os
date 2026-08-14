const { getUserByOpenId, seedDemoTournament } = await import("../server/db.ts");
const ownerOpenId = process.env.OWNER_OPEN_ID;
if (!ownerOpenId) throw new Error("OWNER_OPEN_ID is required");
const owner = await getUserByOpenId(ownerOpenId);
if (!owner) throw new Error("Owner user was not found in the active database");
const result = await seedDemoTournament(owner.id);
console.log(JSON.stringify(result));
