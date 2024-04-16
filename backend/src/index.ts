import { Prisma, PrismaClient, Routine } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
// import { env } from "process";
import OpenAI from "openai";
import { parse } from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cors = require("cors");
const nodemailer = require("nodemailer");

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const prisma = new PrismaClient();

const app = express();

app.use(express.json());
app.use(cors());

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`)
);

app.get(`/test`, async (req, res) => {
  res.sendStatus(200);
});

//User signup
app.post(`/user/create`, async (req, res) => {
  const { username, email, password } = req.body;
  if (!validateEmail(email)) {
    res.sendStatus(400);
  }

  const password_hashed = await hashPassword(password);

  try {
    const result = await prisma.user.create({
      data: {
        email,
        username,
        password_hashed,
        last_login: new Date(),
        active: false,
      },
    });
    const returnData = {
      id: result.id,
      email: result.email,
      username: result.username,
      last_login: result.last_login,
      active: result.active,
    };

    res.status(201).json(returnData);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(e);
      res.sendStatus(409);
    } else {
      res.sendStatus(400);
    }
  }
});

//User login
app.post(`/user/login`, async (req, res) => {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    res.sendStatus(400);
    return;
  }

  console.log("login request by " + email);

  try {
    const result = await prisma.user.findUnique({
      where: { email: email },
    });

    if (result == null) {
      res.sendStatus(401);
    } else {
      if (await comparePasswords(password, result.password_hashed)) {
        result.last_login = new Date();
        const updatedResult = await prisma.user.update({
          where: {
            id: result.id,
          },
          data: result,
        });

        const returnData = {
          id: result.id,
          email: result.email,
          username: result.username,
          last_login: result.last_login,
          active: result.active,
        };

        res.status(200).send(returnData);
      } else {
        res.sendStatus(401);
      }
    }
  } catch (e) {
    console.log(e);

    res.sendStatus(400);
  }
});

//Create email validation code
app.post("/user/createauth", async (req, res) => {
  const { user_id } = req.body;

  const value = Math.floor(Math.random() * 1000000);
  console.log(value);

  try {
    const user = await prisma.user.findUnique({ where: { id: user_id } });

    if (!user || !validateEmail(user.email)) {
      res.sendStatus(401);
      return;
    }

    const prevAuthCode = await prisma.authCode.findUnique({
      where: { user_id },
    });

    let authCode;

    if (!prevAuthCode) {
      authCode = await prisma.authCode.create({
        data: {
          user_id,
          value,
          valid_until: new Date(new Date().getTime() + 15 * 60000),
        },
      });
    } else {
      authCode = await prisma.authCode.update({
        where: {
          user_id,
        },
        data: {
          value,
          valid_until: new Date(new Date().getTime() + 15 * 60000),
        },
      });
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mufitnessnoreply@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: "mufitnessnoreply@gmail.com",
      to: user.email,
      subject: "Mu Fitness App: Validate your email",
      html: `
    <p>Dear ${user.username},</p>
    
    <p>Thank you for registering with the Mu Fitness App. To complete your registration process, please use the following validation code:</p>
    
    <p><strong>Validation Code:</strong> ${value}</p>
    
    <p>Please enter this code on the registration page to verify your email address and activate your account. Your validation code is valid for the next 15 minutes.</p>
    
    <p>If you did not register with Mu Fitness, please disregard this email.</p>
    
    <p>Best Wishes,<br>
    Mu Fitness</p>`,
    };
    transporter.sendMail(mailOptions, function (error: any, info: any) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.sendStatus(200);
      }
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

//Validate user authentication code
app.post("/user/validateauth", async (req, res) => {
  const { user_id, code } = req.body;

  try {
    const result = await prisma.authCode.findUnique({ where: { user_id } });

    if (!result) {
      res.sendStatus(400);
    } else if (new Date() > new Date(result.valid_until)) {
      res.status(401).json({ message: "Authentication token expired" });
    } else if (code != result.value) {
      res.status(401).json({ message: "Invalid authentication token" });
    } else {
      const activateUser = await prisma.user.update({
        where: { id: user_id },
        data: {
          active: true,
        },
      });
      const deleteAuth = await prisma.authCode.delete({ where: { user_id } });
      res.sendStatus(200);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Delete user by email
app.delete("/user/delete", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await prisma.user.delete({
      where: {
        email,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
});

// get all users
app.get("/users", async (req, res) => {
  try {
    let result = await prisma.user.findMany();

    // only keep the fields that we need
    let parsedResult = result.map((user) => {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        active: user.active,
      };
    });

    res.status(200).json(parsedResult);
  } catch (error) {
    res.sendStatus(400);
  }
});

// get user by id
app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    let result = await prisma.user
      .findUnique({
        where: {
          id: parseInt(userId),
        },
        include: {
          followers: true,
          following: true,
          saved_exercises: true,
          workouts: {
            include: {
              // we want the username of the workout owners as well
              user: {
                select: {
                  username: true,
                },
              },
              likes: true,
              comments: {
                include: {
                  user: {
                    select: {
                      username: true,
                    }
                  }
                },
                orderBy: {
                  createdAt: 'desc',
                }
              }
            },
            orderBy: {
              time_created: "desc", // Sort workouts in reverse order by 'created'
            },
          },
          posts: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
              likes: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })
      .then((user) => {
        if (user == null) {
          res.sendStatus(404);
          return;
        }
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          active: user.active,
          // followers: user.followers.map((follower) => follower.followerId),
          // following: user.following.map((following) => following.followingId),
          followers: user.followers,
          following: user.following,
          saved_exercises: user.saved_exercises,
          workouts: user.workouts,
        };
      });

    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(400);
  }
});

// follow user
app.post("/user/follow/:followedUserId", async (req, res) => {
  // userId is following followedUserId
  // userId is the currently logged in user
  const { userId } = req.body;
  const { followedUserId } = req.params;

  // check that the user is not trying to follow themselves
  // and that the accounts exist
  if (userId == followedUserId) {
    console.log("You can't follow yourself dum dum");
    res.sendStatus(400);
    return;
  } else if (userId == null || followedUserId == null) {
    res.sendStatus(400);
    return;
  }

  // check if the user is already following the other user
  const alreadyFollowing = await prisma.follow.findFirst({
    // TODO do I need to do this the other way like in the unfollow endpoint?
    where: {
      followerId: userId,
      followingId: parseInt(followedUserId),
    },
  });
  if (alreadyFollowing) {
    console.log("You are already following this user");
    res.sendStatus(400);
    return;
  }

  // create the new following relationship (adds row to Follow table (which is a join table))
  try {
    const result = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: parseInt(followedUserId),
      },
    });
    console.log("User followed successfully");
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

// unfollow user
app.post("/user/unfollow/:unfollowedUserId", async (req, res) => {
  const { userId } = req.body;
  const { unfollowedUserId } = req.params;

  console.log("entering unfollow endpoint");
  console.log("userId: ", userId);
  console.log("unfollowedUserId: ", unfollowedUserId);

  if (userId == unfollowedUserId) {
    console.log("You can't unfollow yourself dum dum");
    res.sendStatus(400);
    return;
  }
  if (userId == null || unfollowedUserId == null) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: parseInt(unfollowedUserId),
        },
      },
    });
    console.log("User unfollowed successfully");
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

// check if userId follows userIdToCheck
app.get("/user/follows/:userId/:userIdToCheck", async (req, res) => {
  const { userId, userIdToCheck } = req.params;
  if (userId == null || userIdToCheck == null) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await prisma.follow.findFirst({
      where: {
        followerId: parseInt(userId),
        followingId: parseInt(userIdToCheck),
      },
    });
    if (result) {
      res.status(200).json({ follows: true });
    } else {
      res.status(200).json({ follows: false });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// get all followers of a user
app.get("/user/followers/:userId", async (req, res) => {
  const { userId } = req.params;
  if (userId == null) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await prisma.follow.findMany({
      where: {
        followingId: parseInt(userId),
      },
      include: {
        follower: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// get all users that a user is following
app.get("/user/following/:userId", async (req, res) => {
  const { userId } = req.params;
  if (userId == null) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await prisma.follow.findMany({
      where: {
        followerId: parseInt(userId),
      },
      include: {
        following: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// Get recommended exercises from centroid vector of workout by id
app.get(`/exercises/recommendations/:workoutId`, async (req, res) => {
  const { workoutId } = req.params;

  try {
    const result = await prisma.workout.findUnique({
      where: { id: parseInt(workoutId) },
      select: {
        routines: true,
      },
    });

    const embeddings: any[] = [];
    const exercise_names: any[] = [];

    const routines = result?.routines;

    if (!routines || (routines && routines.length === 0)) {
      // console.log("inside if");
      res.status(200).json([]);
      return;
    }

    const promises = routines.map(async (element) => {
      const exerciseResult = await prisma.exercise.findUnique({
        where: { id: element.exercise_id },
        select: {
          embedding: true,
          name: true,
        },
      });

      embeddings.push(exerciseResult?.embedding);
      exercise_names.push(exerciseResult?.name);
      return exerciseResult;
    });

    const promiseResult = await Promise.all(promises);

    // the average embedding
    const centroid = computeCentroid(embeddings);

    // Now you have filled the embeddings and exercise_names lists with data
    // console.log("Embeddings:", embeddings);
    // console.log("Exercise Names:", exercise_names);
    // console.log("Centroid: ", centroid);

    const commonExercises = await prisma.exercise.findMany({
      take: 400,
      orderBy: { log_search_results: "desc" },
      select: {
        id: true,
        name: true,
        embedding: true,
      },
    });

    const k = 5;

    const kNearest = commonExercises
      .filter((exercise) => !exercise_names.includes(exercise.name)) // remove exercises already in the workout
      .map((exercise) => {
        const cosineSimilarity = exercise.embedding.reduce(
          (acc, val, idx) => acc + val * centroid[idx],
          0.0
        );
        return { ...exercise, similarity: cosineSimilarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map((exercise) => {
        return { id: exercise.id, name: exercise.name };
      });

    res.status(200).json(kNearest);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

// Get all exercise names
app.get(`/exercises/names`, async (req, res) => {
  try {
    const exerciseNames = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        log_search_results: "desc",
      },
    });
    //const first100ExerciseNames = exerciseNames.slice(0, 100);
    res.status(200).json(exerciseNames);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.sendStatus(500);
  }
});

//Get one exercise by ID
app.get(`/exercises/one/:exerciseId`, async (req, res) => {
  const { exerciseId } = req.params;

  if (exerciseId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.exercise.findUniqueOrThrow({
      where: {
        id: parseInt(exerciseId),
      },
      include: {
        tags: true,
        muscles: true,
      },
    });

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Check if one exercise is saved by one user
app.get(`/exercises/saved/:userId/:exerciseId`, async (req, res) => {
  const { userId, exerciseId } = req.params;
  try {
    const result = await prisma.userSavedExercises.findMany({
      where: { userId: parseInt(userId), exerciseId: parseInt(exerciseId) },
    });
    if (result.length == 0) {
      res.status(200).json({ saved: false });
    } else {
      res.status(200).json({ saved: true });
    }
  } catch (error) {
    res.sendStatus(400);
  }
});

//Get name and id for all saved exercises for a single user
app.get(`/exercises/saved/:userId`, async (req, res) => {
  const { userId } = req.params;

  try {
    let returnData: any[] = [];
    const result = await prisma.userSavedExercises.findMany({
      where: { userId: parseInt(userId) },
      orderBy: {
        saved: "desc",
      },
      select: {
        exerciseId: true,
        saved: true,
      },
    });

    const exerciseResult = await Promise.all(
      result.map((item) =>
        prisma.exercise
          .findUnique({
            where: { id: item.exerciseId },
            select: {
              id: true,
              name: true,
              video_path: true,
            },
          })
          .then((exercise) => ({ ...exercise, saved: item.saved }))
      )
    );

    res.status(200).json(exerciseResult);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Save Exercise
app.post(`/exercises/save`, async (req, res) => {
  const { userId, exerciseId } = req.body;

  try {
    const result = await prisma.userSavedExercises.create({
      data: {
        userId: parseInt(userId),
        exerciseId: parseInt(exerciseId),
        saved: new Date(),
      },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);

    res.sendStatus(400);
  }
});

//Unsave Exercise
app.post(`/exercises/unsave`, async (req, res) => {
  const { userId, exerciseId } = req.body;

  try {
    const result = await prisma.userSavedExercises.deleteMany({
      where: {
        userId: parseInt(userId),
        exerciseId: parseInt(exerciseId),
      },
    });
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(400);
  }
});

//Get single workout by id
app.get(`/workout/one/:workoutId`, async (req, res) => {
  const { workoutId } = req.params;
  if (workoutId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.workout.findUniqueOrThrow({
      where: {
        id: parseInt(workoutId),
      },
      include: {
        routines: true,
        user: true,
      },
    });
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Get all workouts for a user
app.get(`/workout/many/:userId`, async (req, res) => {
  const { userId } = req.params;

  if (userId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.workout.findMany({
      where: {
        user_id: parseInt(userId),
      },
      include: { routines: true },
    });
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Create workout
app.post(`/workout/create`, async (req, res) => {
  const { userId, name, difficulty, description, tags } = req.body;

  try {
    const result = await prisma.workout.create({
      data: {
        name,
        difficulty,
        description,
        tags: {
          connect: tags.map((tag: number) => ({
            id: tag,
          })),
        },
        user: { connect: { id: parseInt(userId) } },
      },
    });

    res.status(201).json(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

// like a workout
app.post("/workout/:workoutId/like", async (req, res) => {
  const workoutId = parseInt(req.params.workoutId);
  let { userId } = req.body;
  userId = parseInt(userId);

  try {
    const like = await prisma.workoutLike.create({
      data: {
        userId,
        workoutId,
      },
    });
    res.json(like);
  } catch (error) {
    console.error('Failed to like workout:', error);
    res.sendStatus(400);
  }
});

// unlike a workout
app.delete('/workout/:workoutId/like/:userId', async (req, res) => {
  const workoutId = parseInt(req.params.workoutId);
  const userId = parseInt(req.params.userId);

  try {
    const like = await prisma.workoutLike.deleteMany({
      where: {
        userId,
        workoutId,
      },
    });
    res.sendStatus(200)
  } catch (error) {
    console.error('Failed to unlike workout:', error);
    res.sendStatus(400)
  }
});

// get routine by id
app.get(`/workout/routine/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.routine.findUnique({
      where: { id: parseInt(id) },
      include: {
        sets: true,
        exercise: true,
      },
    });
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// add new routine
app.post(`/workout/routine/add`, async (req, res) => {
  const { workout_id, exercise_id } = req.body;
  try {
    const result = await prisma.routine.create({
      data: {
        workout_id,
        exercise_id,
      },
    });

    const setResult = await prisma.defaultSet.create({
      data: {
        routine_id: result.id,
      },
    });

    res.status(201).json(result);
  } catch (e) {
    console.log(e);
  }
});

// update a routine
app.patch("/workout/routine/update/:routineId", async (req, res) => {
  const { routineId } = req.params;

  const { repetitions, rest, weight_lbs } = req.body;

  try {
    const result = await prisma.routine.update({
      where: {
        id: parseInt(routineId),
      },
      data: {
        // repetitions: parseInt(repetitions),
        rest: parseInt(rest),
        // weight_lbs: parseInt(weight_lbs),
      },
    });
    res.status(201).json(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

// delete a routine
app.delete("/workout/routine/delete/:routineId", async (req, res) => {
  const { routineId } = req.params;
  try {
    const result = await prisma.routine.delete({
      where: {
        id: parseInt(routineId),
      },
    });
    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(400);
  }
});

//Get info associated with a set
app.get(`/workout/routine/set/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.defaultSet.findUnique({
      where: { id: parseInt(id) },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

const setDefaultSetOrder = async (req: any, res: any, next: any) => {
  try {
    const { routine_id } = req.body;

    const routine = await prisma.routine.findUnique({
      where: { id: routine_id },
      include: { sets: true },
    });

    next();
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
};

//Create a set
app.post(`/workout/routine/addSet`, setDefaultSetOrder, async (req, res) => {
  const { routine_id } = req.body;

  try {
    const result = await prisma.defaultSet.create({
      data: { routine_id },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Update a set
app.post(`/workout/routine/set/update`, async (req, res) => {
  const { set_id, repetitions, weight_lbs } = req.body;

  try {
    const result = await prisma.defaultSet.update({
      where: { id: set_id },
      data: {
        repetitions: parseInt(repetitions),
        weight_lbs: parseInt(weight_lbs),
      },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Delete a set
app.delete(`/workout/routine/deleteSet/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.defaultSet.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// follower feed endpoint 1
// get all workouts from users that the user is following
app.get(`/feed/workouts/:userId`, async (req, res) => {
  const { userId } = req.params;

  if (userId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.workout.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: parseInt(userId),
            },
          },
        },
      },
      include: {
        // we want the username of the workout owners as well
        user: {
          select: {
            username: true,
          },
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          }
        }
      },
      orderBy: {
        time_created: "desc",
      },
    });
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

// follower feed endpoint 2
// get all posts from users that the user is following
app.get(`/feed/posts/:userId`, async (req, res) => {
  const { userId } = req.params;

  if (userId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.post.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: parseInt(userId),
            },
          },
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert binary image data to Base64 (only needed if we can get images working)
    // const postsWithBase64Images = result.map(post => ({
    //   ...post,
    //   image: post.image ? Buffer.from(post.image).toString('base64') : null,
    // }));

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

// update workout plan
app.post(`/workout/edit`, async (req, res) => {
  // TOOD add ability to update associated routineId? (might not be needed though)
  const { workoutId, name, difficulty, description } = req.body;
  if (workoutId == null) {
    res.sendStatus(400);
    return;
  }

  try {
    const result = await prisma.workout.update({
      where: {
        id: workoutId,
      },
      data: {
        name,
        difficulty,
        description,
        // routines: {
        //   connect: routineIds.map((routineId: number) => ({ id: routineId })),
        // },
      },
      include: {
        routines: true,
      },
    });

    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Delete a workout - TODO authenticate whether user has permissions to delete
app.delete(`/workout/delete/:workoutId`, async (req, res) => {
  const { workoutId } = req.params;
  if (workoutId == null) {
    res.sendStatus(400);
    return;
  }
  try {
    const result = await prisma.workout.delete({
      where: {
        id: parseInt(workoutId),
      },
      include: {
        routines: true,
      },
    });
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Schedule a workout - copies routines and sets for this object
app.post(`/workout/schedule`, async (req, res) => {
  const { day, month, year, workoutId } = req.body;

  try {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { routines: true },
    });

    if (!workout) {
      res.sendStatus(400);
      return;
    }

    const result = await prisma.scheduledWorkout.create({
      data: {
        name: workout.name,
        difficulty: workout.difficulty,
        description: workout.description,
        user_id: workout.user_id,
        date: new Date(year, month, day),
        workout_id: workoutId,
      },
    });

    workout.routines.forEach(async (item) => {
      const routine = await prisma.routine.findUnique({
        where: { id: item.id },
        include: { sets: true },
      });

      if (!routine) {
        res.sendStatus(400);
        return;
      }

      const scheduledRoutine = await prisma.scheduledRoutine.create({
        data: {
          rest: routine.rest,
          exercise_id: routine.exercise_id,
          workout_id: result.id,
        },
      });

      routine.sets.forEach(async (item) => {
        const scheduledSet = await prisma.scheduledSet.create({
          data: {
            repetitions: item.repetitions,
            weight_lbs: item.weight_lbs,
            completed: false,
            routine_id: scheduledRoutine.id,
          },
        });
      });
    });

    res.status(200).send(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Get one scheduled workout by ID
app.get(`/workout/scheduled/one/:id`, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.scheduledWorkout.findUnique({
      where: { id: parseInt(id) },
      include: {
        workout: true,
        user: {
          select: {
            username: true,
          },
        },
        routines: { include: { exercise: true, sets: true } },
      },
    });

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

//Get all scheduled workouts for a user
app.get(`/workout/scheduled/:userId`, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await prisma.scheduledWorkout.findMany({
      where: { user_id: parseInt(userId) },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Complete a scheduled set when stepping through workout
app.post(`/workout/scheduled/set/complete`, async (req, res) => {
  const { id } = req.body;

  try {
    const result = await prisma.scheduledSet.update({
      where: { id: id },
      data: { completed: true },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Mark a scheduled set as incomplete when stepping through workout
app.post(`/workout/scheduled/set/uncomplete`, async (req, res) => {
  const { id } = req.body;

  try {
    const result = await prisma.scheduledSet.update({
      where: { id: id },
      data: { completed: false },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

//Universal search based on textual similarity to query
app.get(`/search/:query`, async (req, res) => {
  const { query } = req.params;
  interface Data {
    exercises: any[];
    workouts: any[];
    users: any[];
  }

  const returnData: Data = {
    exercises: [],
    workouts: [],
    users: [],
  };

  try {
    const exerciseResult = await prisma.exercise.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        video_path: true,
      },
      take: 5,
    });
    returnData.exercises = exerciseResult;

    const workoutResult = await prisma.workout.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    });
    returnData.workouts = workoutResult;

    const userResult = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 5,
    });
    returnData.users = userResult;

    res.status(200).json(returnData);
  } catch (error) {
    res.sendStatus(404);
  }
});

//Smart search to use word embeddings to recommend exercises based on query, not just textual similarity to query
app.get(`/search/smartsearch/:query`, async (req, res) => {
  const { query } = req.params;

  try {
    const embeddings = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: query,
      encoding_format: "float",
    });

    const vector = normalizeL2(embeddings.data[0].embedding.slice(0, 256));

    const commonExercises = await prisma.exercise.findMany({
      take: 500,
      orderBy: { log_search_results: "desc" },
      select: {
        id: true,
        name: true,
        embedding: true,
        video_path: true,
      },
    });

    const k = 5; //arbitrary for now

    const kNearest = commonExercises
      .map((exercise) => {
        const cosineSimilarity = dotProduct(exercise.embedding, vector);
        return { ...exercise, similarity: cosineSimilarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map((exercise) => {
        return {
          id: exercise.id,
          name: exercise.name,
          video_path: exercise.video_path,
        };
      });

    res.status(200).json(kNearest);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});


// like a post
app.post("/posts/:postId/like", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { userId } = req.body;

  try {
    const like = await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
    res.json(like);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// unlike a post
app.delete("/posts/:postId/like/:userId", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const userId = parseInt(req.params.userId);

  try {
    await prisma.like.deleteMany({
      where: {
        userId,
        postId,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// comment on a post
app.post("/posts/:postId/comment", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { userId, text } = req.body;

  // console.log('bm - in commenting endpoint', postId, userId, text)
  
  if (!text || !userId) {
    res.status(400).json({ message: "Please provide a user ID and comment text." });
    return;
  }

  try {
    const comment = await prisma.postComment.create({
        data: {
          content: text,
          postId: postId,
          userId: parseInt(userId),
        },
        include: {
          user: {
            select: {
              username: true,
            }
          }
        }
    });
    res.json(comment);
  } catch (error) {
      console.error("Failed to add comment to post:", error);
      res.status(400).send("Error adding comment to post");
  }
});

app.post("/workouts/:workoutId/comment", async (req, res) => {
  const workoutId = parseInt(req.params.workoutId);
  const { userId, text } = req.body;

  console.log("bm - in workout commenting endpoint", workoutId, userId, text)

  if (!text || !userId) {
    res.status(400).send("Missing comment content or user ID");
    return;
  }

  try {
      const newComment = await prisma.workoutComment.create({
        data: {
          content: text,
          workoutId: workoutId,
          userId: parseInt(userId),
        },
        include: {
          user: {
            select: {
              username: true,
            }
          }
        }
      });
      res.json(newComment);
  } catch (error) {
    console.error("Error posting comment to workout:", error);
    res.status(500).send("Failed to post comment");
  }
});


// delete a post
app.delete("/posts/:postId", async (req, res) => {
  const postId = parseInt(req.params.postId);

  try {
    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// delete a post comment
app.delete("/posts/comment/:commentId", async (req, res) => {
  const commentId = parseInt(req.params.commentId);

  try {
    await prisma.postComment.delete({
      where: {
        id: commentId,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// delete a workout comment
app.delete("/workouts/comment/:commentId", async (req, res) => {
  const commentId = parseInt(req.params.commentId);

  try {
    await prisma.workoutComment.delete({
      where: {
        id: commentId,
      },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

// make a post
app.post("/posts", upload.single('image'), async (req, res) => {
  const { userId, caption } = req.body;
  let file = null;
  if ((req as any).file) {
    file = (req as any).file; // image file
  }
  

  try {
    let imageBuffer = null;
    
    if (file) {
      imageBuffer = file.buffer;
    }

    // Ensure at least one of image or caption is provided
    if (!imageBuffer && !caption) {
      return res.status(400).json({ message: "Please provide either an image or a caption." });
    }

    const post = await prisma.post.create({
      data: {
        userId: parseInt(userId),
        caption,
        image: imageBuffer, 
      },
    });
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Failed to create post." });
  }
});

// get all posts from a user
app.get('/user/:userId/posts', async (req, res) => {
  const { userId } = req.params;

  try {
    const userPosts = await prisma.post.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        user: true,
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    // Convert binary image data to Base64 (will need to use this if we get images working)
    const postsWithBase64Images = userPosts.map(post => ({
      ...post,
      image: post.image ? Buffer.from(post.image).toString('base64') : null,
    }));

    res.json(userPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve posts." });
  }
});



// =================================================================================================
// HELPER FUNCTIONS
// =================================================================================================


//Hash and salt password
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10); // 10 is the number of salt rounds

  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
}

//Use bcyrpt module to compare hashes of the password
async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    return match;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    throw new Error("Error comparing passwords");
  }
}

//Check if is valid email
function validateEmail(email: string): boolean {
  // Regular expression for basic email validation
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

//L2 normalize 1d vector (ONLY WORKS FOR 1D)
function normalizeL2(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((acc, val) => acc + val ** 2, 0));
  if (norm === 0) {
    return vector;
  }

  return vector.map((val) => val / norm);
}

//Dot Product (same as cosine similarity since both vectors are normalized for smartSearch)
function dotProduct(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error("Vectors must have the same length");
  }

  let result = 0;
  for (let i = 0; i < vector1.length; i++) {
    result += vector1[i] * vector2[i];
  }

  return result;
}

function computeCentroid(embeddings: number[][]): number[] {
  const dimension = embeddings[0].length;
  const numVectors = embeddings.length;
  const centroid: number[] = new Array(dimension).fill(0);

  // Sum up all vectors
  for (const vector of embeddings) {
    for (let i = 0; i < dimension; i++) {
      centroid[i] += vector[i];
    }
  }

  // Divide each element by the number of vectors to get the average
  for (let i = 0; i < dimension; i++) {
    centroid[i] /= numVectors;
  }

  return centroid;
}
