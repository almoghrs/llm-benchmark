# Axiom Apparel Frontend Benchmark

## Background and Product Definition
Axiom Apparel is a premium, direct-to-consumer clothing brand focusing on sustainable, high-quality essentials. The user interface requires a clean, minimalist, and editorial design that uses whitespace and elegant typography to convey a sense of luxury. The technical stack for this benchmark is exclusively a frontend React application built with TypeScript. The goal is to progressively build out the application to evaluate development capabilities.

## Step 1: Scaffolding and Static Layout
**Objective:** Establish the initial React application structure and build the static layout components.

- Init an empty project
- Create a global header, a navigation bar, and a main content area.
- Use functional components and basic TypeScript interfaces for all props.
- Ensure the aesthetic relies on clean CSS or utility classes to match the minimalist brand identity.

## Step 2: Basic Interactivity and Forms
**Objective:** Implement local state management and handle user input.

- Create a newsletter subscription section and a dedicated contact form.
- Use controlled components to capture text inputs and manage the internal state.
- Include a submit handler to process the interaction and prevent default browser refresh behavior.

## Step 3: Asynchronous Data and Mock APIs
**Objective:** Handle promises and dynamic data rendering.

- Build a mock asynchronous function that uses a timeout to simulate an external network request.
- Return an array of clothing products with attributes like name, price, and image placeholders.
- Gracefully manage and display loading states and error states before rendering the final product grid using strictly typed interfaces.

## Step 4: Advanced State and Data Manipulation
**Objective:** Introduce complex logic and derived state to the product catalog.

- Add a search input and a sorting dropdown menu.
- Accurately filter the existing product state based on text input.
- Sort the displayed items by price using optimized array methods without mutating the original fetched data.
- Handle empty state scenarios effectively.

## Step 5: Complex Interactions and Architecture
**Objective:** Implement advanced UI patterns and global state architecture.

- Create a functional shopping cart drawer and a multi-step checkout interface.
- Utilize React Context or a similar pattern to elevate state management.
- Allow any component to add or remove cart items without prop drilling.
- Accurately calculate totals and manage product quantities across the application.