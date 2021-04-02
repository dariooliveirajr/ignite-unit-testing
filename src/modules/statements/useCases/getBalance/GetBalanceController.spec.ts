import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { app } from "../../../../app";
import { v4 as uuid } from 'uuid'

let connection: Connection;
let tokenResponse: any;

describe("Get balance", () => {
    beforeAll( async () => {
        connection = await createConnection();
        await connection.runMigrations();

        const id = uuid();
        const password = await hash("1234", 8);

        await connection.query(
            `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
            values('${id}', 'test', 'test@test', '${password}', 'now()', 'now()')`
        );

        tokenResponse = await request(app)
            .post("/api/v1/sessions")
            .send({
                email: "test@test",
                password: "1234"
            });

        await request(app)
        .post("/api/v1/statements/deposit")
        .send({
            amount: 150,
            description: "Test deposit"
        })
        .set({
            Authorization: `Bearer ${tokenResponse.body.token}`
        });

        await request(app)
        .post("/api/v1/statements/withdraw")
        .send({
            amount: 140,
            description: "Test withdraw"
        })
        .set({
            Authorization: `Bearer ${tokenResponse.body.token}`
        });
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
      });

      it("should be able to get the user balance", async () => {
        const response = await request(app)
        .get("/api/v1/statements/balance")
        .set({
            Authorization: `Bearer ${tokenResponse.body.token}`
        });

        expect(response.status).toBe(200);
        expect(response.body.balance).toBe(10);
      });
})