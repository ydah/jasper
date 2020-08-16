import {StreamRepo} from '../StreamRepo';
import {IssueRepo} from '../IssueRepo';
import {ConfigRepo} from '../ConfigRepo';
import {FilteredStreamRepo} from '../FilteredStreamRepo';
import {GitHubSearchClient} from '../GitHub/GitHubSearchClient';
import {DateUtil} from '../../Util/DateUtil';

class _StreamSetup {
  async exec() {
    const already = await this.isAlready();
    if (already) return;

    await this.createMeStream();
    await this.createRepoStreams();
  }

  private async isAlready(): Promise<boolean> {
    // stream
    {
      const {error, streams} = await StreamRepo.getAllStreams();
      if (error) return true;
      if (streams.length !== 0) return true;
    }

    // issue
    {
      const {error, count} = await IssueRepo.getTotalCount();
      if (error) return true;
      if (count !== 0) return true;
    }

    return false;
  }

  private async createMeStream() {
    // create stream
    const color = '#d93f0b';
    const queries = [`involves:${ConfigRepo.getLoginName()}`, `user:${ConfigRepo.getLoginName()}`];
    const {error, stream} = await StreamRepo.createStream('Me', queries, 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    const login = ConfigRepo.getLoginName();
    await FilteredStreamRepo.createFilteredStream(stream, 'My Issues', `is:issue author:${login}`, 1, color);
    await FilteredStreamRepo.createFilteredStream(stream, 'My PRs', `is:pr author:${login}`, 1, color);
    await FilteredStreamRepo.createFilteredStream(stream, 'Assign', `assignee:${login}`, 1, color);
  }

  private async createRepoStreams() {
    // create stream
    const color = '#0e8a16';
    const repos = await this.getUsingRepos();
    const query = repos.map(repo => `repo:${repo}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('Repo', [query], 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const repo of repos) {
      const shortName = repo.split('/')[1];
      await FilteredStreamRepo.createFilteredStream(stream, `${shortName}`, `repo:${repo}`, 1, color);
    }
  }

  private async getUsingRepos(): Promise<string[]> {
    const github = ConfigRepo.getConfig().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${ConfigRepo.getLoginName()} updated:>=${updatedAt}`;
    const {error, body} = await client.search(query, 1, 100, false);
    if (error) {
      console.error(error);
      return [];
    }

    if (!body.items.length) return [];

    const repoCounts = {};
    for (const issue of body.items) {
      const paths = issue.url.split('/').reverse();
      const repo = `${paths[3]}/${paths[2]}`;
      if (!repoCounts[repo]) repoCounts[repo] = 0;
      repoCounts[repo]++;
    }

    const items = Object.keys(repoCounts).map(repo => ({repo: repo, count: repoCounts[repo]}));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 3).map(item => item.repo);
  }
}

export const StreamSetup = new _StreamSetup();