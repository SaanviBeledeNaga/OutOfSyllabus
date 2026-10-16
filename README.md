# OutOfSyllabus

## Contact form setup

Copy `.env.example` to `.env` and set `VITE_FORM_ENDPOINT` to a Formspree endpoint configured to deliver to `outofsyllabus.hello@gmail.com`. If it is empty, the form opens a prefilled email to that address instead. Restart Vite after changing environment values.

## Tune the hero video start

Change the `START_OFFSET` constant near the top of `src/App.tsx` to skip more or fewer opening frames. It defaults to `0.15` seconds.
