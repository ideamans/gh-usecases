export interface ErrorInfo {
  title: string;
  causes: string[];
  solutions: string[];
}

export function getErrorInfo(error: Error | string): ErrorInfo {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Network/Connection errors
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
    return {
      title: 'ネットワーク接続エラー',
      causes: [
        'インターネット接続が切断されている',
        'GitHubのサーバーに接続できない',
        'ファイアウォールやプロキシの設定',
      ],
      solutions: [
        'インターネット接続を確認してください',
        'VPNを使用している場合は一時的に無効にしてみてください',
        'しばらく待ってから再度お試しください',
      ],
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('authentication') || errorMessage.includes('token') || errorMessage.includes('401')) {
    return {
      title: '認証エラー',
      causes: [
        'GitHubの認証情報が無効または期限切れ',
        'アクセストークンの権限が不足している',
        'gh CLIにログインしていない',
      ],
      solutions: [
        '`gh auth login`を実行して再度ログインしてください',
        '`gh auth status`で認証状態を確認してください',
        'プロジェクト関連の権限(project, read:org)があることを確認してください',
      ],
    };
  }
  
  // Permission/Authorization errors
  if (errorMessage.includes('permission') || errorMessage.includes('403') || errorMessage.includes('access')) {
    return {
      title: 'アクセス権限エラー',
      causes: [
        '必要な権限が付与されていない',
        '組織の設定でアクセスが制限されている',
        'プロジェクトやチームへのアクセス権がない',
      ],
      solutions: [
        '組織の管理者に必要な権限を依頼してください',
        'アクセストークンのスコープを確認してください',
        '`gh auth refresh -s project,read:org`で権限を更新してください',
      ],
    };
  }
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return {
      title: 'リソースが見つかりません',
      causes: [
        '指定されたプロジェクト、組織、チームが存在しない',
        'リソースへのアクセス権限がない',
        'URLやIDが間違っている',
      ],
      solutions: [
        '名前やIDが正しいか確認してください',
        'アクセス権限があることを確認してください',
        '組織名やプロジェクト名の大文字小文字を確認してください',
      ],
    };
  }
  
  // Rate limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      title: 'API制限エラー',
      causes: [
        'GitHub APIのレート制限に達した',
        '短時間に多くのリクエストを送信した',
      ],
      solutions: [
        'しばらく待ってから再度お試しください（通常1時間後）',
        '`gh api rate_limit`でレート制限の状態を確認してください',
        '認証済みユーザーとして実行していることを確認してください',
      ],
    };
  }
  
  // GraphQL errors
  if (errorMessage.includes('GraphQL') || errorMessage.includes('query')) {
    return {
      title: 'APIリクエストエラー',
      causes: [
        'GitHub APIの仕様が変更された',
        '無効なクエリパラメータ',
        'サーバー側の一時的な問題',
      ],
      solutions: [
        'アプリケーションを最新バージョンに更新してください',
        '入力内容に特殊文字が含まれていないか確認してください',
        'しばらく待ってから再度お試しください',
      ],
    };
  }
  
  // Project/Team specific errors  
  if (errorMessage.includes('プロジェクトの作成に失敗')) {
    return {
      title: 'プロジェクト作成エラー',
      causes: [
        'プロジェクト名が既に使用されている',
        '組織のプロジェクト作成権限がない',
        '組織のプロジェクト数の上限に達した',
      ],
      solutions: [
        '別のプロジェクト名を試してください',
        '組織の管理者に権限を確認してください',
        '既存のプロジェクトを削除してから再度お試しください',
      ],
    };
  }
  
  if (errorMessage.includes('チームの読み込みに失敗')) {
    return {
      title: 'チーム読み込みエラー',
      causes: [
        '組織のチームへのアクセス権がない',
        '組織が存在しないまたはアクセスできない',
      ],
      solutions: [
        '組織のメンバーであることを確認してください',
        '組織名が正しいか確認してください',
        '`gh auth refresh -s read:org`で権限を更新してください',
      ],
    };
  }
  
  if (errorMessage.includes('プロジェクトをチームに追加できません')) {
    return {
      title: 'チーム追加エラー',
      causes: [
        'チームへのプロジェクト追加権限がない',
        'プロジェクトが既にチームに追加されている',
      ],
      solutions: [
        'チームの管理者に権限を依頼してください',
        '選択したチームを確認してください',
        '組織の管理者にプロジェクト設定を確認してください',
      ],
    };
  }
  
  // Validation errors
  if (errorMessage.includes('required') || errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      title: '入力エラー',
      causes: [
        '必須項目が入力されていない',
        '入力形式が正しくない',
        '文字数制限を超えている',
      ],
      solutions: [
        '必須項目をすべて入力してください',
        '特殊文字や絵文字を避けてください',
        'プロジェクト名は255文字以内で入力してください',
      ],
    };
  }
  
  // Project name required error
  if (errorMessage.includes('プロジェクト名は必須です')) {
    return {
      title: 'プロジェクト名が入力されていません',
      causes: [
        'プロジェクト名が空欄です',
      ],
      solutions: [
        'プロジェクト名を入力してEnterを押してください',
        '英数字、ハイフン、アンダースコアが使用できます',
      ],
    };
  }
  
  // Team selection specific errors
  if (errorMessage.includes('at least one team') || errorMessage.includes('少なくとも1つのチームを選択')) {
    return {
      title: 'チーム選択エラー',
      causes: [
        'チームが選択されていない',
      ],
      solutions: [
        'スペースキーで1つ以上のチームを選択してください',
        '選択後、Enterキーで確定してください',
      ],
    };
  }
  
  // Personal account team error
  if (errorMessage.includes('Personal accounts cannot have teams') || errorMessage.includes('個人アカウントにはチーム機能がありません')) {
    return {
      title: 'アカウントタイプエラー',
      causes: [
        '個人アカウントにはチーム機能がありません',
      ],
      solutions: [
        '組織アカウントを選択してください',
        '個人プロジェクトの場合はチーム追加をスキップしてください',
      ],
    };
  }
  
  // Default error
  return {
    title: 'エラーが発生しました',
    causes: [
      '予期しないエラーが発生しました',
    ],
    solutions: [
      'エラーメッセージの詳細を確認してください',
      '問題が続く場合は、GitHubのステータスページを確認してください',
      'アプリケーションを再起動してみてください',
    ],
  };
}

export function formatErrorDisplay(error: Error | string): string[] {
  const info = getErrorInfo(error);
  const lines: string[] = [];
  
  lines.push(`❌ ${info.title}`);
  lines.push('');
  
  if (info.causes.length > 0) {
    lines.push('考えられる原因:');
    info.causes.forEach(cause => {
      lines.push(`  • ${cause}`);
    });
    lines.push('');
  }
  
  if (info.solutions.length > 0) {
    lines.push('解決方法:');
    info.solutions.forEach((solution, index) => {
      lines.push(`  ${index + 1}. ${solution}`);
    });
  }
  
  // Add original error message for debugging
  const originalMessage = typeof error === 'string' ? error : error.message;
  if (originalMessage) {
    lines.push('');
    lines.push(`詳細: ${originalMessage}`);
  }
  
  return lines;
}