<h1 align="center">
  <a href="https://kafkas.github.io/firecode">
    Firecode
  </a>
</h1>

<p align="center">
  A light, fast, and memory-efficient collection traversal library for Firestore and Node.js.
</p>

---

<p align="center">
    <a href="https://github.com/kafkas/firecode/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Firecode is released under the MIT license." /></a>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Version">
        <img src="https://img.shields.io/npm/v/@firecode/admin" /></a>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Size">
        <img src="https://img.shields.io/bundlephobia/min/@firecode/admin" /></a>
    <a href="https://npmjs.com/package/@firecode/admin" alt="Downloads">
        <img src="https://img.shields.io/npm/dm/@firecode/admin" /></a>
    <a href="https://" alt="Types">
        <img src="https://img.shields.io/npm/types/@firecode/admin" /></a>
    <a href="https://github.com/kafkas/firecode" alt="Activity">
        <img src="https://img.shields.io/github/commit-activity/m/kafkas/firecode" /></a>
    <a href="https://" alt="Last Commit">
        <img src="https://img.shields.io/github/last-commit/kafkas/firecode" /></a>
    <a href="https://lerna.js.org/" alt="Framework">
        <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" /></a>
    <a href="https://kafkas.github.io/firecode/0.6.3/">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" /></a>
</p>

Firecode is a Node.js library that lets you efficiently traverse Firestore collections.

When you have millions of documents in a collection, you can't just get all of them at once as your program's memory usage will explode. Firecode's configurable traverser objects let you do this in a simple, intuitive and memory-efficient way using batching.

Firecode is an extremely light, well-typed, zero-dependency library that is useful in a variety of scenarios. You can use it in database migration scripts (e.g. when you need to add a new field to all docs) or a scheduled Cloud Function that needs to check every doc in a collection periodically or a locally run script that retrieves some data from a collection.

## API

This site contains the full API reference and documentation for each version of Firecode. Please choose a version to view the docs.

### Versions
