import OSS from '@/features/legal/oss-licenses.json';
import { COMMUNITY_MIN_AGE, buildAccountDeletionDoc, buildPolicyDocs } from '@/features/legal/policy-texts';

const ALLOWED = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'Unlicense', 'CC0-1.0', 'BlueOak-1.0.0', 'OFL-1.1'];

describe('legal texts', () => {
  it('warns instead of inventing a contact when none is configured', () => {
    const docs = buildPolicyDocs({ email: '', operator: '' });
    expect(docs.privacy.sections.find((s) => s.heading.includes('보호책임자'))!.body).toContain('미설정');
    expect(docs.terms.sections.at(-1)!.body).toContain('EXPO_PUBLIC_SUPPORT_EMAIL');
  });

  it('describes the real data flows (grid-only weather, on-device link import, age limit)', () => {
    const body = buildPolicyDocs({ email: 'a@b.c', operator: '홍길동' }).privacy.sections.map((s) => s.body).join('\n');
    expect(body).toContain('격자 번호');
    expect(body).toContain('WearLog 서버를 거치지 않으며');
    expect(body).toContain(`만 ${COMMUNITY_MIN_AGE}세`);
    expect(body).toContain('홍길동');
    expect(buildAccountDeletionDoc({ email: 'a@b.c', operator: 'x' }).sections[1].body).toContain('a@b.c');
  });

  it('ships only allow-listed open source licenses', () => {
    const ok = (expr: string): boolean => {
      const e = expr.replace(/[()]/g, '').trim();
      if (e.includes(' OR ')) return e.split(' OR ').some(ok);
      return e.split(' AND ').every((x) => ALLOWED.includes(x.trim()));
    };
    expect(OSS.packages.length).toBeGreaterThan(50);
    expect(OSS.packages.filter((p) => !ok(p.license))).toEqual([]);
  });
});
