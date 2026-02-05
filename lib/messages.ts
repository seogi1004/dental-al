export const MESSAGES = {
  leave: {
    add: {
      namePrompt: (staffNames: string) => `연차를 추가할 직원 이름을 입력하세요:\n\n현재 직원: ${staffNames}`,
      typePrompt: `연차 타입을 입력하세요:\n\n• 공백 또는 Enter = 종일 연차\n• AM = 오전 반차\n• PM = 오후 반차`,
      alreadyExists: (name: string, original: string) => `${name}님은 이 날짜에 이미 연차가 등록되어 있습니다.\n\n기존: ${original}\n\n수정이 필요하면 기존 항목을 클릭해주세요.`,
      failure: (error: string) => `추가 실패: ${error}`,
    },
    edit: {
      prompt: (originalDate: string) => `연차 날짜를 수정하세요 (M/D 형식):\n예: 1/15, 1/15 AM, 1/15 PM`,
      failure: (error: string) => `수정 실패: ${error}`,
    },
    delete: {
      confirm: (staffName: string, originalDate: string) => `${staffName}님의 연차(${originalDate})를 삭제하시겠습니까?`,
      failure: (error: string) => `삭제 실패: ${error}`,
    },
  },
  off: {
    add: {
      namePrompt: (staffNames: string) => `오프를 추가할 직원 이름을 입력하세요:\n\n현재 직원: ${staffNames}`,
      typePrompt: `오프 타입을 입력하세요:\n\n• 공백 또는 Enter = 종일 오프\n• AM = 오전 오프\n• PM = 오후 오프`,
      failure: (error: string) => `오프 추가 실패: ${error}`,
    },
    edit: {
      prompt: (name: string, originalDate: string) => `${name}님의 오프 (${originalDate}) 수정\n\n오프 날짜를 수정하세요 (M/D 형식):\n예: 1/15, 1/15 AM, 1/15 PM`,
      mobilePrompt: `오프 날짜를 수정하세요 (M/D 형식):\n예: 1/15, 1/15 AM, 1/15 PM`,
      success: `오프가 수정되었습니다.`,
      failure: (error: string) => error || `오프 수정에 실패했습니다.`,
    },
    delete: {
      confirm: (name: string, date: string) => `${name}님의 오프(${date})를 삭제하시겠습니까?`,
      success: `오프가 삭제되었습니다.`,
      failure: (error: string) => error || `오프 삭제에 실패했습니다.`,
    },
  },
  staff: {
    add: {
      limitReached: `최대 직원 수(14명)를 초과하여 추가할 수 없습니다.`,
    },
    delete: {
      confirm: `정말 삭제하시겠습니까?`,
    },
    notFound: `존재하지 않는 직원입니다.`,
  },
  validation: {
    invalidDate: `올바른 형식으로 입력해주세요.\n\n예: 1/15, 1/15 AM, 1/15 PM`,
    invalidOffDate: `올바른 날짜 형식으로 입력해주세요. (M/D)\n예: 1/15`,
    invalidType: `올바른 타입을 입력해주세요.\n\n• 공백 = 종일\n• AM = 오전 반차\n• PM = 오후 반차`,
  },
  common: {
    loading: `로딩 중...`,
    noSchedules: `이번 달 예정된 일정이 없습니다.`,
  }
};
