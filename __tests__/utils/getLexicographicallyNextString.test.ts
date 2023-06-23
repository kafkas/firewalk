import { getLexicographicallyNextString } from './getLexicographicallyNextString';

test('correctly computes lexicographically next string', () => {
  expect(getLexicographicallyNextString('')).toStrictEqual('a');
  expect(getLexicographicallyNextString('a')).toStrictEqual('b');
  expect(getLexicographicallyNextString('abc')).toStrictEqual('abd');
  expect(getLexicographicallyNextString('abc123')).toStrictEqual('abc124');
  expect(getLexicographicallyNextString('abc123xyz')).toStrictEqual('abc123xzz');
  expect(getLexicographicallyNextString('z')).toStrictEqual('za');
  expect(getLexicographicallyNextString('zz')).toStrictEqual('zza');
});
