import Sequencer, { ShardOptions } from "@jest/test-sequencer";
import { Test } from "@jest/test-result";
import slash from "slash";
import * as crypto from "crypto";
import * as path from "path";

export default class CustomSequencer extends Sequencer {
  /**
   * Select tests for shard requested via --shard=shardIndex/shardCount
   * Sharding is applied before sorting
   * Based on the default Jest sharder except it avoids empty shards
   * https://github.com/facebook/jest/blob/main/packages/jest-test-sequencer/src/index.ts#L40
   * See https://github.com/facebook/jest/issues/13027 for more context
   */
  shard(tests: Array<Test>, options: ShardOptions): Array<Test> | Promise<Array<Test>> {
    const minShardSize = Math.floor(tests.length / options.shardCount);

    const bucketsToAddOneTo = tests.length % options.shardCount;
    const shards: Array<number> = Array(options.shardCount);
    for (let i = 0; i < options.shardCount; i++) {
      const shardSize = i < bucketsToAddOneTo ? minShardSize + 1 : minShardSize;
      shards[i] = shardSize;
    }

    const shardStart = shards.slice(0, options.shardIndex - 1).reduce((a, b) => a + b, 0);

    const shardEnd = shardStart + shards[options.shardIndex - 1];

    return tests
      .map(test => {
        const relativeTestPath = path.posix.relative(
          slash(test.context.config.rootDir),
          slash(test.path)
        );

        return {
          hash: crypto.createHash("sha1").update(relativeTestPath).digest("hex"),
          test,
        };
      })
      .sort((a, b) => (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0))
      .slice(shardStart, shardEnd)
      .map(result => result.test);
  }
}
