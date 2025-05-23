import SocialMediaConnector, { 
  AuthConfig, 
  PostContent, 
  PostResult, 
  SocialAccount 
} from './SocialMediaConnector';

/**
 * FacebookConnector - Implementação específica para integração com Facebook Graph API
 */
export class FacebookConnector extends SocialMediaConnector {
  private apiVersion = 'v17.0';
  private baseUrl = 'https://graph.facebook.com';
  private pageId: string | null = null;
  private pageAccessToken: string | null = null;

  constructor(authConfig: AuthConfig, pageId?: string) {
    super(authConfig);
    this.pageId = pageId || null;
  }

  protected getPlatformName(): string {
    return 'Facebook';
  }

  /**
   * Gera a URL de autorização para o fluxo OAuth do Facebook
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(','),
      response_type: 'code',
      state: this.generateRandomState() // Método herdado da classe base
    });
    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Processa o código de autorização recebido após o redirecionamento OAuth
   */
  async handleAuthorizationCode(code: string): Promise<SocialAccount> {
    try {
      // Usa simulação da classe base
      const tokenResponse = await this.simulateTokenExchange(code);

      // Simulação da obtenção de informações do usuário (específico do Facebook)
      const userInfo = await this.simulateGetUserInfo(tokenResponse.access_token);

      this.account = {
        id: userInfo.id,
        platform: 'facebook',
        username: userInfo.name,
        displayName: userInfo.name,
        profilePictureUrl: userInfo.picture?.data?.url,
        isConnected: true,
        lastSyncTime: new Date(),
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000)
      };

      // Se um pageId foi fornecido, obter o token de acesso da página
      if (this.pageId) {
        await this.fetchAndSetPageAccessToken(this.pageId, tokenResponse.access_token);
      }

      return this.account;
    } catch (error) {
      console.error('Erro ao processar código de autorização Facebook:', error);
      throw new Error('Falha na autenticação com Facebook Graph API');
    }
  }

  /**
   * Atualiza o token de acesso se necessário, usando a lógica base
   */
  async refreshAccessTokenIfNeeded(): Promise<boolean> {
    const refreshed = await this.baseRefreshAccessTokenIfNeeded(60); // Usa threshold de 60 minutos
    if (refreshed && this.pageId && this.account?.accessToken) {
      // Se o token foi atualizado e temos uma página definida, atualiza o token da página também
      try {
        await this.fetchAndSetPageAccessToken(this.pageId, this.account.accessToken);
      } catch (error) {
        console.error('Erro ao atualizar token da página do Facebook após refresh:', error);
        // Considerar se isso deve invalidar a conexão da página
      }
    }
    return refreshed;
  }

  /**
   * Publica conteúdo no Facebook (perfil ou página)
   */
  async publishPost(content: PostContent): Promise<PostResult> {
    if (!this.isAuthenticated()) {
      return this.createErrorResult('Não autenticado');
    }

    if (!await this.refreshAccessTokenIfNeeded()) {
        return this.createErrorResult('Falha ao atualizar token de acesso');
    }

    const validation = this.validateContent(content);
    if (!validation.isValid) {
      return this.createErrorResult(validation.errors.join(', '));
    }

    try {
      const targetId = this.pageId || 'me';
      const accessToken = this.pageId ? this.pageAccessToken : this.account?.accessToken;

      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      const postData = this.formatContent(content);
      // Simulação da publicação (específico do Facebook)
      const result = await this.simulateCreatePost(targetId, postData, accessToken);

      return {
        success: true,
        postId: result.id,
        url: `https://facebook.com/${result.id.replace('_', '/posts/')}`,
        timestamp: new Date(),
        platform: 'facebook'
      };
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Erro ao publicar conteúdo');
    }
  }

  /**
   * Agenda uma publicação para um momento futuro no Facebook
   */
  async schedulePost(content: PostContent, scheduledTime: Date): Promise<PostResult> {
    if (!this.isAuthenticated()) {
      return this.createErrorResult('Não autenticado');
    }

    if (!await this.refreshAccessTokenIfNeeded()) {
        return this.createErrorResult('Falha ao atualizar token de acesso');
    }

    const validation = this.validateContent({ ...content, scheduledTime });
    if (!validation.isValid) {
      return this.createErrorResult(validation.errors.join(', '));
    }

    try {
      const targetId = this.pageId || 'me';
      const accessToken = this.pageId ? this.pageAccessToken : this.account?.accessToken;

      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      const postData = {
        ...this.formatContent(content),
        published: false,
        scheduled_publish_time: Math.floor(scheduledTime.getTime() / 1000)
      };

      // Simulação do agendamento (específico do Facebook)
      const result = await this.simulateCreatePost(targetId, postData, accessToken);

      return {
        success: true,
        postId: result.id,
        url: `https://facebook.com/${result.id.replace('_', '/posts/')}`,
        timestamp: new Date(),
        platform: 'facebook'
      };
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Erro ao agendar publicação');
    }
  }

  /**
   * Obtém métricas de uma publicação
   */
  async getPostMetrics(postId: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Não autenticado');
    }

    if (!await this.refreshAccessTokenIfNeeded()) {
        throw new Error('Falha ao atualizar token de acesso');
    }

    try {
      const accessToken = this.pageId ? this.pageAccessToken : this.account?.accessToken;
      if (!accessToken) {
        throw new Error('Token de acesso não disponível');
      }
      // Simulação da obtenção de métricas (específico do Facebook)
      return await this.simulateGetPostInsights(postId, accessToken);
    } catch (error) {
      console.error('Erro ao obter métricas da publicação Facebook:', error);
      throw new Error('Falha ao obter métricas da publicação');
    }
  }

  /**
   * Define a página do Facebook para publicação
   */
  async setPage(pageId: string): Promise<boolean> {
    if (!this.isAuthenticated() || !this.account?.accessToken) {
      return false;
    }

    try {
      return await this.fetchAndSetPageAccessToken(pageId, this.account.accessToken);
    } catch (error) {
      console.error('Erro ao definir página Facebook:', error);
      return false;
    }
  }

  /**
   * Obtém as páginas do Facebook gerenciadas pelo usuário
   */
  async getPages(): Promise<any[]> {
    if (!this.isAuthenticated() || !this.account?.accessToken) {
      return [];
    }

    if (!await this.refreshAccessTokenIfNeeded()) {
        console.error('Falha ao atualizar token de acesso ao buscar páginas do Facebook.');
        return [];
    }

    try {
      // Simulação da obtenção de páginas (específico do Facebook)
      const pagesResponse = await this.simulateGetPages(this.account.accessToken);
      return pagesResponse.data;
    } catch (error) {
      console.error('Erro ao obter páginas Facebook:', error);
      return [];
    }
  }

  /**
   * Publica conteúdo em um grupo do Facebook
   */
  async publishToGroup(groupId: string, content: PostContent): Promise<PostResult> {
    if (!this.isAuthenticated() || !this.account?.accessToken) {
      return this.createErrorResult('Não autenticado');
    }

    if (!await this.refreshAccessTokenIfNeeded()) {
        return this.createErrorResult('Falha ao atualizar token de acesso');
    }

    const validation = this.validateContent(content);
    if (!validation.isValid) {
      return this.createErrorResult(validation.errors.join(', '));
    }

    try {
      const postData = this.formatContent(content);
      // Simulação da publicação em grupo (específico do Facebook)
      const result = await this.simulateCreateGroupPost(groupId, postData, this.account.accessToken);

      return {
        success: true,
        postId: result.id,
        url: `https://facebook.com/groups/${groupId}/posts/${result.id}`,
        timestamp: new Date(),
        platform: 'facebook'
      };
    } catch (error: any) {
      return this.createErrorResult(error.message || 'Erro ao publicar no grupo');
    }
  }

  /**
   * Formata o conteúdo de acordo com as especificações da API do Facebook
   */
  protected formatContent(content: PostContent): any {
    const formattedContent: any = {};
    if (content.text) formattedContent.message = content.text;
    if (content.link) {
      formattedContent.link = content.link.url;
      if (content.link.title) formattedContent.name = content.link.title;
      if (content.link.description) formattedContent.description = content.link.description;
      if (content.link.thumbnailUrl) formattedContent.picture = content.link.thumbnailUrl;
    }
    // Upload de mídia seria mais complexo
    return formattedContent;
  }

  /**
   * Validação específica para conteúdo do Facebook
   */
  validateContent(content: PostContent): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validateContent(content);
    const errors = [...baseValidation.errors];

    if (content.text && content.text.length > 63206) {
      errors.push('O texto da publicação não pode exceder 63.206 caracteres');
    }
    if (content.scheduledTime) {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
      const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
      if (content.scheduledTime < tenMinutesFromNow) {
        errors.push('A data de agendamento deve ser pelo menos 10 minutos no futuro');
      }
      if (content.scheduledTime > sixMonthsFromNow) {
        errors.push('A data de agendamento não pode ser mais de 6 meses no futuro');
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Implementação da revogação de token para Facebook (usa simulação base)
   */
  protected async revokeToken(token: string): Promise<void> {
    // Em produção, faria uma chamada DELETE para /me/permissions com o access_token
    await this.simulateRevokeToken(token);
  }

  /**
   * Limpa dados específicos do Facebook ao desconectar
   */
  protected clearAccountData(): void {
    super.clearAccountData();
    this.pageId = null;
    this.pageAccessToken = null;
  }

  // --- Métodos Auxiliares Específicos (Simulação) ---

  private async simulateGetUserInfo(accessToken: string): Promise<any> {
    return {
      id: 'fb_user_' + Math.random().toString(36).substring(2, 15),
      name: 'Usuário Facebook Simulad',
      email: 'user.fb@example.com',
      picture: { data: { url: 'https://placehold.co/400x400/4267B2/ffffff?text=FB' } }
    };
  }

  private async simulateGetPages(accessToken: string): Promise<any> {
    return {
      data: [
        { id: 'fb_page_1', name: 'Página Empresa Simulada', category: 'Negócio', access_token: 'fb_page_token_1' + Math.random().toString(36).substring(2, 15) },
        { id: 'fb_page_2', name: 'Página Loja Simulada', category: 'Varejo', access_token: 'fb_page_token_2' + Math.random().toString(36).substring(2, 15) }
      ]
    };
  }

  private async simulateCreatePost(targetId: string, postData: any, accessToken: string): Promise<any> {
    return { id: targetId + '_' + Math.random().toString(36).substring(2, 15), created_time: new Date().toISOString() };
  }

  private async simulateCreateGroupPost(groupId: string, postData: any, accessToken: string): Promise<any> {
    return { id: Math.random().toString(36).substring(2, 15), created_time: new Date().toISOString() };
  }

  private async simulateGetPostInsights(postId: string, accessToken: string): Promise<any> {
    return {
      data: [
        { name: 'post_impressions', period: 'lifetime', values: [{ value: Math.floor(Math.random() * 10000) }] },
        { name: 'post_engaged_users', period: 'lifetime', values: [{ value: Math.floor(Math.random() * 1000) }] }
      ]
    };
  }

  private async fetchAndSetPageAccessToken(pageId: string, userAccessToken: string): Promise<boolean> {
    const pagesResponse = await this.simulateGetPages(userAccessToken);
    const page = pagesResponse.data.find((p: any) => p.id === pageId);
    if (page) {
      this.pageId = pageId;
      this.pageAccessToken = page.access_token;
      console.info(`Token de acesso obtido para a página do Facebook: ${pageId}`);
      return true;
    } else {
      console.warn(`Página do Facebook com ID ${pageId} não encontrada ou sem permissão.`);
      this.pageId = null;
      this.pageAccessToken = null;
      return false;
    }
  }

  private createErrorResult(error: string): PostResult {
      return {
          success: false,
          error,
          timestamp: new Date(),
          platform: 'facebook'
      };
  }
}

export default FacebookConnector;

