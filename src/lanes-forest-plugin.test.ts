import { assert, describe, it } from '@effect/vitest'

import {
	decodeForestWorktreeCopies,
	forestCopyForWorktreePath,
	forestCopyMatchingWorktreePath,
	forestWorktreeDirectoryToOpen,
	lanesWorktreePathsFromUnknown,
} from '#/src/lanes-forest-plugin'

const featureCopy = {
	worktreePath: '/tmp/worktree/feature',
	head: 'abc',
	branch: 'feature',
	absolutePath: '/tmp/worktree/feature/notes/alpha.md',
	vaultRelativePath: 'notes/alpha.md',
}

const otherCopy = {
	worktreePath: '/tmp/worktree/other',
	head: 'def',
	branch: 'other',
	absolutePath: '/tmp/worktree/other/notes/alpha.md',
	vaultRelativePath: 'notes/alpha.md',
}

describe('forestCopyMatchingWorktreePath', () => {
	it('prefers the copy whose path matches frontmatter', () => {
		const matched = forestCopyMatchingWorktreePath(
			[otherCopy, featureCopy],
			'/tmp/worktree/feature',
		)

		assert.strictEqual(matched?.branch, 'feature')
	})

	it('falls back to the first copy when frontmatter does not match', () => {
		const matched = forestCopyMatchingWorktreePath([otherCopy, featureCopy], '/nope')

		assert.strictEqual(matched?.branch, 'other')
	})

	it('returns null when there are no copies', () => {
		assert.strictEqual(forestCopyMatchingWorktreePath([], '/wt'), null)
	})
})

describe('forestCopyForWorktreePath', () => {
	it('returns only an exact worktree match', () => {
		assert.strictEqual(
			forestCopyForWorktreePath([otherCopy, featureCopy], '/tmp/worktree/feature')?.branch,
			'feature',
		)
		assert.strictEqual(forestCopyForWorktreePath([otherCopy], '/tmp/worktree/feature'), null)
	})
})

describe('forestWorktreeDirectoryToOpen', () => {
	it('uses frontmatter even when Forest listed no copies', () => {
		assert.strictEqual(
			forestWorktreeDirectoryToOpen({
				copies: [],
				worktreePath: '/tmp/worktree/feature',
			}),
			'/tmp/worktree/feature',
		)
	})

	it('uses the first copy when frontmatter is missing', () => {
		assert.strictEqual(
			forestWorktreeDirectoryToOpen({
				copies: [otherCopy],
				worktreePath: null,
			}),
			'/tmp/worktree/other',
		)
	})
})

describe('lanesWorktreePathsFromUnknown', () => {
	it('keeps a single path', () => {
		assert.deepStrictEqual(lanesWorktreePathsFromUnknown('/tmp/worktree/feature'), [
			'/tmp/worktree/feature',
		])
	})

	it('keeps a list of paths', () => {
		assert.deepStrictEqual(lanesWorktreePathsFromUnknown(['/tmp/a', '', '/tmp/b']), [
			'/tmp/a',
			'/tmp/b',
		])
	})

	it('drops non-paths', () => {
		assert.deepStrictEqual(lanesWorktreePathsFromUnknown(1), [])
	})
})

describe('decodeForestWorktreeCopies', () => {
	it('keeps well-shaped copies', () => {
		assert.strictEqual(decodeForestWorktreeCopies([featureCopy]).length, 1)
	})

	it('drops malformed payloads', () => {
		assert.deepStrictEqual(decodeForestWorktreeCopies([{ path: '/wt' }]), [])
	})
})
