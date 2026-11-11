# GO—YOU

GO—YOU is a strength-training log for people who lift. You open it between sets, record what you just did, and put
the phone back down. Over weeks and months it turns those entries into a clear picture of whether you are getting stronger.

It is built for a phone in one hand at the gym. It has big controls, few screens and nothing to set up, so logging a set
takes a couple of seconds and never pulls you out of your workout.

**Try it:** [go-you.vercel.app](https://go-you.vercel.app)

## The idea

Most workout apps ask you to plan before you train. GO—YOU works the other way round: you just train, and it learns from what
you do. Every set you log feeds three things:

- **Your personal records.** For every exercise, GO—YOU estimates your one-rep max from the weight and reps you lift. When a set
  beats your best, it is flagged as a PR right away, while you are still at the rack.
- **Your history.** Each workout is kept as you logged it, so you can look back at any session.
- **Your routines.** Once you have trained 21 times, GO—YOU looks for the workouts you keep repeating and offers them as
  ready-made routines, so you never have to build a template by hand.

## A session, start to finish

1. **Start.** From the Train screen, start a blank workout or pick one of your routines.
2. **Add an exercise.** Type its name. If you have done it before, GO—YOU shows what you lifted last time and fills that in
   as your starting point.
3. **Log sets.** Adjust the reps and weight with the plus and minus buttons and save the set. Work in kilograms or pounds;
   GO—YOU remembers your choice. A weight of zero counts as a bodyweight set.
4. **Rest.** A timer counts down your rest after each set, and the screen stays on so you don't have to unlock your phone.
5. **Finish.** You get a summary of the session: how long it took, how many sets, the total weight moved and any new PRs.

Gym Wi-Fi is often bad, so a workout in progress is stored on your phone and is only sent when you finish. Closing the app,
reloading or losing signal doesn't cost you anything. If you delete a set by mistake you can undo it, and if saving fails
your workout stays put until you retry.

## Screens

- **Train:** start a workout, see this week's and this month's progress toward your goals, and open your routines.
- **Log:** every workout you have done, grouped by month. Open one to see each set, with PRs marked.
- **Stats:** your records, how often you train, how much you lift each week and your most-trained exercises,
  over the last 7, 30 or 90 days or all time.
- **Goals:** set how many times a week and a month you want to train, and follow your progress toward unlocking routines.

Signing up is just an email and a password: the first time you sign in, your account is created.

## Design

GO—YOU has a deliberately plain, industrial look: black and white, square edges, bold uppercase labels and no decoration.
Every control is large enough to hit with a sweaty thumb, everything works with a keyboard and screen reader, and animation
is turned off for anyone who prefers reduced motion.

## Under the hood

GO—YOU is a [Next.js 16](https://nextjs.org) app written in TypeScript with React 19, hosted on [Vercel](https://vercel.com),
with its data in PostgreSQL on [Neon](https://neon.tech).

- **Pages load on the server.** The Train, Log and Stats screens fetch their data on the server and arrive ready to read,
  without the browser having to make a second round of requests.
- **One save per workout.** A finished workout is sent in a single request and written to the database all at once. Each
  workout carries its own ID from the phone, so sending it twice can never create a duplicate.
- **The numbers.** Estimated one-rep maxes use the Epley formula. Everything is calculated in kilograms and converted for
  display, so you can mix kilograms and pounds freely.
- **Your time zone.** Weeks (starting Monday), months and dates follow the time zone you are in, not the server's.
- **Fast repeat visits.** Stats and exercise history are cached for each user and refreshed as soon as you save a new workout.

| | |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS with a small set of design tokens, Space Grotesk |
| Sign-in | NextAuth with email and password, passwords hashed with bcrypt |
| Data | Prisma ORM on PostgreSQL (Neon) |
| Workout in progress | Zustand, saved to the browser's local storage |
| Hosting | Vercel, with server functions in Singapore next to the database |
