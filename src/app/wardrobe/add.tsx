import { useRouter } from 'expo-router';
import { useState } from 'react';

import { GarmentEditor, emptyGarment } from '@/features/wardrobe/components/GarmentEditor';
import { useAppState } from '@/hooks/app-state';

/** 옷 등록 (단일 아이템 사진 또는 직접 입력). 착장 사진 후보 추출은 Phase 0 POC 이후. */
export default function AddGarmentScreen() {
  const router = useRouter();
  const { bumpData } = useAppState();
  const [initial] = useState(emptyGarment);
  return (
    <GarmentEditor
      initial={initial}
      onSaved={() => {
        bumpData();
        router.back();
      }}
    />
  );
}
