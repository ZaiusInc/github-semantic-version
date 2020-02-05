import Github from "@octokit/rest";
import * as debug from "./debug";

export default class GithubAPI {
  constructor(userRepo, apiOptions = {}) {
    debug.info("Running GithubAPI constructor");
    this.defaultOptions = {
      owner: userRepo.user,
      repo: userRepo.repo,
    };

    this.github = new Github(apiOptions);
    debug.info("Created Github API object");

    // this buys you 5000 requests an hour in all but the Search API, where you get 30 requests/min
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

    if (token) {
      this.github.authenticate({
        token: token,
        type: "oauth"
      });
      debug.info("Authenticated Github API object");
    }
  }

  async getCommit(hash) {
    debug.info(`Getting commit ${hash} via Github API`);
    return this.github.repos
      .getCommit({ ...this.defaultOptions, sha: hash })
      .then(({ data: commit }) => {
        return {
          date: commit.commit.author.date,
          sha: commit.sha,
          user: commit.author ? commit.author.login : undefined,
          userName: commit.commit.author.name,
          message: commit.commit.message,
          url: commit.html_url,
        };
      });
  }

  async getPullRequest(prNumber) {
    debug.info(`Getting PR ${prNumber} via Github API`);
    return this.github.pullRequests
      .get({ ...this.defaultOptions, number: prNumber })
      .then(({ data: pr }) => {
        return {
          date: pr.merged_at,
          user: pr.user.login,
          title: pr.title,
          number: pr.number,
          url: pr.html_url,
        };
      });
  }

  async listLabelsOnIssue(issueNumber) {
    debug.info(`Getting labels on issue ${issueNumber} via Github API`);
    return this.github.issues
      .listLabelsOnIssue({ ...this.defaultOptions, number: issueNumber })
      .then(({ data: issues }) => issues);
  }

  async addLabelToIssue(issueNumber, label) {
    debug.info(`Adding label ${label} on issue ${issueNumber} via Github API`);
    return this.github.issues.addLabels({
      ...this.defaultOptions,
      number: issueNumber,
      labels: [label],
    });
  }

  // convert query object to a string in the format: searchProperty1:searchValue1 [searchPropertyN:searchValueN]
  formatSearchString(query) {
    let q = `repo:${this.defaultOptions.owner}/${this.defaultOptions.repo}`;

    for (let key in query) {
      if (query.hasOwnProperty(key)) {
        q += ` ${key}:\"${query[key]}\"`;
      }
    }

    return q.trim();
  }

  async searchIssues(query) {
    debug.info(`Searching issues via Github API`);
    // the search string takes the format: searchProperty1:searchValue1 [searchPropertyN:searchValueN]
    const q = this.formatSearchString(query);
    const allIssues = [];
    const concatAndPage = response => {
      response.data.items.forEach((issue) => {
        allIssues.push({
          date: issue.closed_at,
          user: issue.user.login,
          title: issue.title,
          labels: issue.labels,
          number: issue.number,
          url: issue.html_url,
        });
      });

      if (this.github.hasNextPage(response)) {
        return this.github.getNextPage(response).then(concatAndPage);
      } else {
        return allIssues;
      }
    };

    return this.github.search.issues({ per_page: 100, q }).then(concatAndPage);
  }

  async getCommitsFromPullRequest(prNumber) {
    debug.info(`Getting commits from PR ${prNumber} via Github API`);
    return this.github.pullRequests
      .getCommits({
        ...this.defaultOptions,
        number: prNumber,
        per_page: 100,
      })
      .then(({ data: commits }) => {
        return commits.map(c => c.sha);
      });
  }

  async getCommitsFromRepo(query = {}) {
    debug.info(`Getting commits from repo via Github API`);
    const allCommits = [];
    const concatAndPage = response => {
      response.data.forEach((commit) => {
        allCommits.push({
          date: commit.commit.author.date, // some heirarchy
          sha: commit.sha,
          user: commit.author ? commit.author.login : undefined,
          userName: commit.commit.author.name,
          message: commit.commit.message,
          url: commit.html_url,
        });
      });

      if (this.github.hasNextPage(response)) {
        return this.github.getNextPage(response).then(concatAndPage);
      } else {
        return allCommits;
      }
    };

    return this.github.repos.getCommits({ ...this.defaultOptions, ...query }).then(concatAndPage);
  }
};
