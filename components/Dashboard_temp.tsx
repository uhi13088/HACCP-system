// 긴급 점검 시작
const handleEmergencyCheck = () => {
  toast.warning("긴급 점검 시작", {
    description: "1. 모든 센서 상태 확인\n2. CCP 점검 실행\n3. 긴급 체크리스트 활성화",
    duration: 5000
  });
};