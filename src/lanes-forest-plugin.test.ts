import { assert, describe, it } from '@effect/vitest'

import {
	decodeForestWorktreeCopies,
	forestCopyMatchingWorktreePath,
	forestWorktreeDirectoryToOpen,
} from '#src/lanes-forest-plugin'

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

describe('decodeForestWorktreeCopies', () => {
	it('keeps well-shaped copies', () => {
		assert.strictEqual(decodeForestWorktreeCopies([featureCopy]).length, 1)
	})

	it('drops malformed payloads', () => {
		assert.deepStrictEqual(decodeForestWorktreeCopies([{ path: '/wt' }]), [])
	})
})
