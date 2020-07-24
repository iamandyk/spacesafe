import { getSession } from "next-auth/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function (req, res) {
  const session = await getSession({ req });

  if (req.method === "GET") {
    const checkIns = await prisma.activityLog.findMany({
      where: {
        AND: [
          { user: { email: session.user.email } },
          {
            checkOut: null,
          },
        ],
      },
      include: {
        location: true,
      },
    });

    res.json({ checkIns });
  }

  if (session) {
    const { body, query } = req;

    if (query.fieldSite) {
      const location = await prisma.location.upsert({
        create: {
          name: body.location,
          fieldSite: true,
        },
        update: {},
        where: {
          name: body.location,
        },
      });

      const checkin = await prisma.activityLog.create({
        data: {
          user: {
            connect: {
              email: session.user.email,
            },
          },
          location: {
            connect: {
              id: location.id,
            },
          },
        },
        include: {
          location: true,
        },
      });

      res.json(checkin);
    } else {
      const checkin = await prisma.activityLog.create({
        data: {
          user: {
            connect: {
              email: session.user.email,
            },
          },
          location: {
            connect: {
              id: body.location,
            },
          },
          roomNumber: parseInt(body.roomNumber)
            ? parseInt(body.roomNumber)
            : null,
        },
        include: {
          location: true,
        },
      });

      res.json(checkin);
    }
  }
}
